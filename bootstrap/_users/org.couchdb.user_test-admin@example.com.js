var password = require('kazana-config').pouchdbHttpAdminPass;

module.exports = {
   _id: 'org.couchdb.user:kazana-admin@example.com',
   type: 'user',
   name: 'kazana-admin@example.com',
   roles: [
       'kazana-id:testadmin',
       'kazana-data-provider',
       'kazana-data-reviewer',
       'kazana-analyst',
       'kazana-admin'
   ],
   password: password,
   createdAt: '2015-04-15T00:00:00.000Z',
   fullname: 'Test Admin'
};