module.exports = addCorsHeaders;

function addCorsHeaders (request, reply) {
  if (!request.headers.origin) {
    return reply.continue();
  }

  var allowedHeaders = [];

  // depending on whether we have a boom or not,
  // headers need to be set differently.
  var response = request.response.isBoom ? request.response.output : request.response;

  if (request.method === 'options') {
    response.statusCode = 200;
  }

  if (request.headers['Allow-Control-Request-Headers']) {
    allowedHeaders = request.headers['Allow-Control-Request-Headers'].split(',');
  }

  response.headers['access-control-allow-origin'] = request.headers.origin;
  response.headers['access-control-allow-headers'] = allowedHeaders.join(', ');
  response.headers['access-control-expose-headers'] = 'content-type, content-length, etag';
  response.headers['access-control-allow-methods'] = 'GET, PUT, POST, DELETE';
  response.headers['access-control-allow-credentials'] = 'true';

  reply.continue();
}
