module.exports = tokenToCookieHeaders;

function tokenToCookieHeaders (token) {
  return {
    headers: {
      cookie: 'AuthSession=' + token
    }
  };
}
