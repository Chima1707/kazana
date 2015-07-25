var password = require('kazana-config').pouchdbHttpAdminPass;

module.exports = {
   _id: 'org.couchdb.user:kazana-data-provider@example.com',
   type: 'user',
   name: 'kazana-data-provider@example.com',
   roles: [
       'kazana-id:testdataprovider',
       'kazana-data-provider'
   ],
   password: password,
   createdAt: '2015-04-15T00:00:00.000Z',
   fullname: 'Test Data Provider'
};
