module.exports = getStore;

var PouchDB = require('pouchdb');
var Hoek = require('hoek');
PouchDB.plugin(require('pouchdb-hoodie-api'));

var toCookieHeaders = require('../utils/token-to-cookie-headers');

/**
 * returns a PouchDB instance
 *
 * @param  {string}   options.name  Name of CouchDB database.
 *                                  raw-data & integrated-data get resolve to
 *                                  names configured names via env variables
 * @return {PouchDB instance}
 **/
function getStore (options) {
  var kazana = this;

  Hoek.assert(typeof options === 'object', 'options must be set for getStore');
  Hoek.assert(typeof options.name === 'string', 'options.name must be a string');

  var dbName = toDbName(kazana, options.name);

  if (kazana.settings.app.pouchdbAdapter === 'http') {
    dbName = kazana.settings.app.pouchdbHttpUrl + '/' + dbName;
  } else {
    throw new Error('Only http adapter supported at this point');
  }

  var db = new PouchDB(dbName, {
    ajax: getAjaxOptions(kazana, options)
  });

  return db.hoodieApi();
}

/**
 * resolve 'raw-data', 'integrated-data' to what is configured in KAZANA_DB_*
 */
function toDbName (kazana, name) {
  return {
      'raw-data': kazana.settings.app.dbRawData,
      'integrated-data': kazana.settings.app.dbIntegratedData
    }[name] || name;
}

/**
 * A db can either be authenticated by the current user, the CouchDB admin
 * or not authenticated at all
 **/
function getAjaxOptions (kazana, options) {
  var token;

  if (!options.auth) return {};

  if (options.auth === 'admin') {
    return {
      auth: {
        username: kazana.settings.app.pouchdbHttpAdminUser,
        password: kazana.settings.app.pouchdbHttpAdminPass
      }
    };
  }

  Hoek.assert(options.auth && options.auth.headers, 'invalid options.auth for getStore');
  var requestHeaders = options.auth.headers;

  // turn request object to token, if authorization header is set
  if (!requestHeaders.authorization) return {};

  token = requestHeaders.authorization.substring('Bearer '.length);
  return toCookieHeaders(token);
}
