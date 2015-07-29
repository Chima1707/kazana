var test = require('tape');
var corePlugins = require('../../lib/core-plugins');
var pluck = require('lodash/collection/pluck');

test('corePlugins', function (t) {
  t.plan(2);

  t.equal(corePlugins.length, 2, 'two coreplugins');
  t.deepEqual(pluck(corePlugins, 'name').sort(), ['account', 'raw-data'], 'account & raw-data');
});
