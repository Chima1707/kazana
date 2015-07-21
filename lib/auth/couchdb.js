module.exports = couchdbAuth;

function couchdbAuth (server) {
  return {
    authenticate: function (request, reply) {
      server.methods.getUser(request)

        .then(function (user) {
          reply.continue({
            credentials: user
          });
        })
        .catch(reply.pouchdbError.bind(reply));
    }
  };
}
