module.exports = getCouchUrl

/**
 * returns a PouchDB instance
 *
 * @param  {object}     request   hapi request object
 * @returns  {Promise}
 **/
function getCouchUrl () {
  var kazana = this

  if (kazana.settings.app.backendName === 'couchdb') {
    return kazana.settings.app.backendLocation
  }

  return kazana.info.protocol + '://0.0.0.0:' + kazana.settings.app.backendPort
}
