module.exports = getUser;

var _ = require('lodash');
var Boom = require('boom');
var PouchDB = require('pouchdb');
var Promise = require('pouchdb/extras/promise');
var Hoek = require('hoek');
PouchDB.plugin(require('pouchdb-authentication'));

var toCookieHeaders = require('../utils/token-to-cookie-headers');

/**
 * returns a PouchDB instance
 *
 * @param  {object}     request   hapi request object
 * @returns  {Promise}
 **/
function getUser (request) {
  var kazana = this;

  Hoek.assert(typeof request === 'object', 'request must be passed to getUser');

  if (!request.headers.authorization) {
    return Promise.reject(Boom.unauthorized('User not authenticated'));
  }

  var dbName = '_users';
  if (kazana.settings.app.pouchdbAdapter === 'http') {
    dbName = kazana.settings.app.pouchdbHttpUrl + '/' + dbName;
  } else {
    throw new Error('Only http adapter supported at this point');
  }

  var token = request.headers.authorization.substring('Bearer '.length);
  var db = new PouchDB(dbName);
  var options = {
    ajax: toCookieHeaders(token)
  };

  return db.getSession(options)

    .then(function (response) {
      var username = response.userCtx.name;

      return db.getUser(username, options);
    })

    .then(function (userDoc) {
      var username = userDoc.name;
      var roles = userDoc.roles.filter(function (role) {
        return !/^kazana-/.test(role);
      });
      var idRoles = userDoc.roles.filter(function (role) {
        return /^kazana-id:/.test(role);
      });
      var isAdmin = userDoc.roles.filter(function (role) {
          return /^kazana-admin$/.test(role);
        }).length === 1;
      var groups = userDoc.roles.filter(function (role) {
        return /^kazana-group:/.test(role);
      }).map(toGroupName);

      // remove CouchDB internal properties
      delete userDoc._id;
      delete userDoc._rev;
      delete userDoc.password_scheme;
      delete userDoc.iterations;
      delete userDoc.type;
      delete userDoc.name;
      delete userDoc.roles;
      delete userDoc.derived_key;
      delete userDoc.salt;

      if (idRoles.length === 1) {
        var id = idRoles[0].substr('kazana-id:'.length);
      } else {
        kazana.log('warn', 'user ' + username + ' has no id role. Add `id:<uuid here>` to roles.');
      }

      return _.merge(userDoc, {
        login: username,
        id: id,
        isAdmin: isAdmin,
        roles: roles,
        groups: groups
      });
    });
}

function toGroupName (role) {
  return role.substring('kazana-group:'.length);
}
