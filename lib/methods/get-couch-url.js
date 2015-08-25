module.exports = getCouchUrl

/**
 * returns a PouchDB instance
 *
 * @param  {object}     request   hapi request object
 * @returns  {Promise}
 **/
function getCouchUrl () {
  var kazana = this

  if (kazana.settings.app.backend.name === 'couchdb') {
    return kazana.settings.app.backend.location
  }

  return kazana.info.protocol + '://0.0.0.0:' + kazana.settings.app.backend.port
}
