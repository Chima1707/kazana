var password = require('kazana-config').pouchdbHttpAdminPass;

module.exports = {
   _id: 'org.couchdb.user:kazana-analyst@example.com',
   type: 'user',
   name: 'kazana-analyst@example.com',
   roles: [
       'kazana-id:testanalyst',
       'kazana-analyst'
   ],
   password: password,
   createdAt: '2015-04-15T00:00:00.000Z',
   fullname: 'Test Analyst'
};
