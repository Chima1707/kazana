module.exports = replyPouchDbError

var Boom = require('boom')

/**
 * Turns PouchDB errors into Hapi response errors
 */
function replyPouchDbError (error) {
  return this.response(Boom.wrap(error, error.status))
}
