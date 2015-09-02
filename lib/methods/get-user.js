module.exports = getUser

var _ = require('lodash')
var Boom = require('boom')
var PouchDB = require('pouchdb')
var Promise = require('pouchdb/extras/promise')
var Hoek = require('hoek')
PouchDB.plugin(require('pouchdb-authentication'))

var toCookieHeaders = require('../utils/token-to-cookie-headers')

/**
 * returns a PouchDB instance
 *
 * @param  {object}     request   hapi request object
 * @returns  {Promise}
 **/
function getUser (request) {
  var kazana = this

  Hoek.assert(typeof request === 'object', 'request must be passed to getUser')

  var token = requestToToken(request)

  if (!token) {
    return Promise.reject(Boom.unauthorized('User not authenticated'))
  }

  var dbUrl = kazana.methods.getCouchUrl() + '/_users'
  var db = new PouchDB(dbUrl)
  var options = {
    ajax: toCookieHeaders(token)
  }

  return db.getSession(options)

    .then(function (response) {
      var username = response.userCtx.name

      // we need an admin-authenticated database due to
      // https://github.com/pouchdb/pouchdb-server/issues/101
      var options = {
        ajax: {
          auth: {
            username: kazana.settings.app.adminUser,
            password: kazana.settings.app.adminPass
          }
        }
      }

      return db.getUser(username, options)
    })

    .then(function (userDoc) {
      var username = userDoc.name
      var roles = userDoc.roles.filter(function (role) {
        return !/^kazana-/.test(role)
      })
      var idRoles = userDoc.roles.filter(function (role) {
        return /^kazana-id:/.test(role)
      })
      var isAdmin = userDoc.roles.filter(function (role) {
          return /^kazana-admin$/.test(role)
        }).length === 1
      var groups = userDoc.roles.filter(function (role) {
        return /^kazana-group:/.test(role)
      }).map(toGroupName)

      // remove CouchDB internal properties
      delete userDoc._id
      delete userDoc._rev
      delete userDoc.password_scheme
      delete userDoc.iterations
      delete userDoc.type
      delete userDoc.name
      delete userDoc.roles
      delete userDoc.derived_key
      delete userDoc.salt

      if (idRoles.length === 1) {
        var id = idRoles[0].substr('kazana-id:'.length)
      } else {
        kazana.log('warn', 'user ' + username + ' has no id role. Add `id:<uuid here>` to roles.')
      }

      return _.merge(userDoc, {
        login: username,
        id: id,
        isAdmin: isAdmin,
        roles: roles,
        groups: groups
      })
    })
}

function toGroupName (role) {
  return role.substring('kazana-group:'.length)
}

function requestToToken (request) {
  var token

  if (request.headers.authorization) {
    token = request.headers.authorization.substring('Bearer '.length)
  } else if (request.query.token) {
    token = request.query.token
    delete request.query.token
  }

  return token
}
