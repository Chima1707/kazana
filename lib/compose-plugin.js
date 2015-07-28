module.exports = composePlugin;

var _ = require('lodash');
var bootstrap = require('kazana-bootstrap');
var parseConfig = require('kazana-config/parse');

/**
 *  takes a Kazana Plugin object and turns it into a hapi plugin function
 *
 * @param  {string}   plugin                    Kazana Plugin Object
 */
function composePlugin (plugin) {
  var attributes = {
    name: plugin.name,
    version: plugin.version
  };
  hapiPlugin.attributes = attributes;

  return {
    register: hapiPlugin,
    options: plugin
  };

  function hapiPlugin (server, options, next) {
    if (options.config) {
      _.merge(server.settings.app, parseConfig(options.config));
    }

    if (options.static) {
      server.route({
        method: 'GET',
        path: '/{param*}',
        config: {
          auth: false
        },
        handler: {
          directory: {
            path: options.static
          }
        }
      });
    }

    if (options.routes) {
      server.route(options.routes);
    }

    if (typeof options.bootstrap === 'function') {
      options.bootstrap(server, plugin, function () {
        server.log([plugin.name, 'bootstrap'], 'done');
      });
    }

    if (typeof options.bootstrap === 'string') {
      bootstrap({
        bootstrapPath: options.bootstrap,
        couchdb: {
          url: server.settings.app.pouchdbHttpUrl,
          adminUser: server.settings.app.pouchdbHttpAdminUser,
          adminPass: server.settings.app.pouchdbHttpAdminPass
        },
        log: server.log.bind(server)
      }, function (error) {
        if (error) throw error;
        server.log([plugin.name, 'bootstrap'], 'done');
      });
    }

    if (options.indices) {
      createOrUpdateIndices(server, options.indices)
        .then(function () {
          server.log([plugin.name, 'indices'], 'Indices created in: ' + Object.keys(options.indices).join(', '));
        })
        .catch(function (error) {
          server.log([plugin.name, 'indices', 'error'], error);
        });
    }

    if (options.transform) {
      registerTransformers(server, plugin, options.transform);
    }

    if (options.service) {
      registerService(server, options.service, function (error) {
        if (error) return server.log([plugin.name, 'service', 'error'], error);

        server.log([plugin.name, 'service'], 'started');
      });
    }

    if (options.plugins) {
      options.plugins.map(composePlugin).forEach(function (plugin) {
        server.register(plugin, {
          routes: {
            prefix: '/kazana/' + plugin.register.attributes.name
          }
        }, function (error) {
          if (error) throw error;
        });
      });
    }

    next();
  }
}

function createOrUpdateIndices (server, indicesMaps) {
  var dbNames = Object.keys(indicesMaps);

  var promises = dbNames.map(function (dbName) {
    var store = server.methods.getStore({
      name: dbName,
      auth: 'admin'
    });

    var indicesMap = indicesMaps[dbName];
    var indicesNames = Object.keys(indicesMap);
    var indices = indicesNames.map(function (name) {
      var indexOptions = indicesMap[name];

      var index = {
        id: toIndexId(name),
        version: indexOptions.version,
        views: {}
      };
      index.views[name] = {
        map: indexOptions.map.toString(),
        reduce: indexOptions.reduce && indexOptions.reduce.toString()
      };
      return index;
    });

    return indices.map(store.updateOrAdd);
  });

  return server.app.utils.Promise.all(promises);
}

function toIndexId (name) {
  return '_design/' + name;
}

function registerService (server, service, callback) {
  service(server, callback);
}

function registerTransformers (server, plugin, transformersMap) {
  var sourceIds = Object.keys(transformersMap);

  sourceIds.forEach(function (sourceId) {
    var tmp = transformersMap[sourceId];
    var indicatorName = tmp[0];
    var transform = tmp[1];

    server.app.admin.rawData.on('change', handleDataReport.bind(null, server, plugin, indicatorName, transform));

    server.app.admin.rawData.db.query('submissions', {
      startkey: ['byState', 'pending', sourceId],
      endkey: ['byState', 'pending', sourceId, {}],
      reduce: false,
      include_docs: true
    })

      .then(function (response) {
        return _.pluck(response.rows, 'doc').map(toObject);
      })

      .then(function (reports) {
        reports.forEach(handleDataReport.bind(null, server, plugin, indicatorName, transform, 'pending'));
      })

      .catch(server.log.bind(server, [plugin.name, 'transform', sourceId, 'error']));
  });
}

function handleDataReport (server, plugin, indicatorName, transform, eventName, report) {
  if (eventName === 'update' && report.transformedAt) {
    return;
  }

  server.log([plugin.name, report.sourceId, report.scope.id], 'removing integrated data ...');

  server.app.admin.integratedData.removeAll(function (doc) {
    return doc.dataReport && doc.dataReport.id === report.id;
  })
    .then(function (dataReports) {
      server.log([plugin.name, report.sourceId, report.scope.id], 'removed ' + dataReports.length + ' integrated data docs ...');

      if (eventName === 'remove') {
        return;
      }

      transformDataReport(server, plugin, indicatorName, transform, eventName, report);
    })
    .catch(server.log.bind(server, [plugin.name, report.sourceId, report.scope.id, 'error']));
}

function transformDataReport (server, plugin, indicatorName, transform, eventName, report) {
  server.log([plugin.name, report.sourceId, report.scope.id, eventName], 'normalising ...');
  transform(server, report, function (error, integratedData) {
    if (error) {
      server.log([plugin.name, report.sourceId, report.scope.id, 'error'], error);
      return server.app.admin.rawData.update(report.id, {
        transformedAt: new Date(),
        transformationErrors: [error]
      });
    }

    var integrated = integratedData.map(function (data) {
      return {
        data: data
      };
    });
    integrated.forEach(addMeta.bind(null, server, report));

    server.app.admin.integratedData.add(integrated)

      .then(function (integrated) {
        var summary = integrated.length + ' integrated docs created.';
        server.log([plugin.name, report.sourceId, report.scope.id], summary);

        server.app.admin.rawData.update(report.id, {
          transformedAt: new Date(),
          transformationSummary: summary
        });
      })

      .catch(server.log.bind(server, [plugin.name, report.sourceId, report.scope.id, 'error']));
  });
}

function toObject (doc) {
  if (doc instanceof Error) return doc;

  doc.id = doc._id;
  delete doc._id;
  return doc;
}

function addMeta (server, report, indicator) {
  indicator.id = report.id + ':' + server.app.utils.uuid(10);
  indicator.dataReport = {
    id: report.id,
    sourceId: report.sourceId,
    createdAt: report.createdAt,
    transformedAt: report.transformedAt,
    createdBy: report.createdBy,
    updatedBy: report.updatedBy
  };
}
