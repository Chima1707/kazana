module.exports = kazanaServer;

var _ = require('lodash');
var bootstrap = require('kazana-bootstrap');
var config = require('kazana-config');
var corsHeaders = require('hapi-cors-headers');
var good = require('good');
var goodConsole = require('good-console');
var Hapi = require('hapi');
var Hoek = require('hoek');

var path = require('path');
var PouchDB = require('pouchdb');
var Promise = require('pouchdb/extras/promise');

var composePlugin = require('./lib/compose-plugin');
var corePlugins = require('./lib/core-plugins');

// auth
var couchdbAuth = require('./lib/auth/couchdb');

// decorators
var replyPouchDbError = require('./lib/decorators/reply-pouchdb-error');

// methods
var getStore = require('./lib/methods/get-store');
var getUser = require('./lib/methods/get-user');

function kazanaServer (main, options) {
  if (!options) options = {};
  var server = new Hapi.Server({
    app: _.merge({}, config, options),
    connections: {
      router: {
        stripTrailingSlash: true
      }
    }
  });

  server.connection({
    port: main.port
  });

  server.app.utils = {
    Promise: Promise,
    assert: Hoek.assert,
    uuid: PouchDB.utils.uuid
  };

  server.app.admin = {
    rawData: getStore.call(server, {
      name: 'raw-data',
      auth: 'admin'
    }),
    integratedData: getStore.call(server, {
      name: 'integrated-data',
      auth: 'admin'
    })
  };

  // logging
  var loggerOptions = {
    opsInterval: 1000,
    reporters: [{
      reporter: goodConsole,
      events: {
        log: '*',
        request: '*',
        response: '*'
      }
    }]
  };
  server.register({
    register: good,
    options: loggerOptions
  }, function (error) {
    if (error) console.error(error);
  });

  // auth
  server.auth.scheme('couchdb', couchdbAuth);
  server.auth.strategy('couchdb', 'couchdb', true, options);

  // decorations
  server.decorate('reply', 'pouchdbError', replyPouchDbError);

  // extensions
  server.ext('onPreResponse', corsHeaders);

  // methods
  server.method('getStore', getStore, {
    bind: server
  });
  server.method('getUser', getUser, {
    bind: server
  });

  bootstrap({
    bootstrapPath: path.resolve(__dirname, './bootstrap'),
    couchdb: {
      url: server.settings.app.pouchdbHttpUrl,
      adminUser: server.settings.app.pouchdbHttpAdminUser,
      adminPass: server.settings.app.pouchdbHttpAdminPass
    },
    log: server.log.bind(server)
  }, function (error) {
    if (error) throw error;

    server.register(composePlugin(main), function (error) {
      if (error) throw error;
    });

    if (!options.bare) {
      corePlugins.map(composePlugin).forEach(function (plugin) {
        server.log(['plugin', plugin.register.attributes.name], 'registering...');
        server.register(plugin, {
          routes: {
            prefix: '/kazana/' + plugin.register.attributes.name
          }
        }, function (error) {
          if (error) throw error;
          server.log(['plugin', plugin.register.attributes.name], 'registered.');
        });
      });
    }

    server.register({
      register: require('lout')
    }, function (error) {
      if (error) throw error;
    });
  });

  return server;
}
