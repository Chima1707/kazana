# kazana

> A modular data warehouse system

[![NPM version](https://badge.fury.io/js/kazana.svg)](https://www.npmjs.com/package/kazana)
[![Build Status](https://travis-ci.org/eHealthAfrica/kazana.svg?branch=master)](https://travis-ci.org/eHealthAfrica/kazana)
[![Coverage Status](https://coveralls.io/repos/eHealthAfrica/kazana/badge.svg?branch=master)](https://coveralls.io/r/eHealthAfrica/kazana?branch=master)
[![Dependency Status](https://david-dm.org/eHealthAfrica/kazana.svg)](https://david-dm.org/eHealthAfrica/kazana)

## Usage

```js
module.exports = {
  name: 'myapp',
  version: '1.0.0',
  port: 5000,
  static: 'public',
  routes: routes,
  bootstrap: 'bootstrap',
  indices: {
    'integrated-data': {
      'byYearAndMonth': mapReduce
    }
  },
  transform: {
    'commodities-excel-report': ['commodity', transformCommoditiesExcelReport]
  },
  validate: {
    commodity: validateCommodityData
  },
  service: function (server, callback) {
    // initialise service, setup cron jobs and what not
    callback()
  },
  plugins: appPlugins
}
```

See example app at [eHealthAfrica/kazana-example/index.js](https://github.com/eHealthAfrica/kazana-example/blob/master/index.js)

## Options

Options for the `new Kazana` constructor

### name _(required)_

Name of the app / plugin

### version _(required)_

[SemVer](http://semver.org/) compatible version. Pro tip:

```
  version: require('./package').version
```

### port _(required)_

Default port number for app.

### static

Path to folder from where to serve static assets at the root path.

```js
  static: 'public'
```

Is simply a shortcut for

```js
  routes: [{
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'public'
      }
    }
  }]
```

### routes

Array of [hapi routes](http://hapijs.com/tutorials/routing)

### bootstrap

Either a function with a callback, or a path to bootstrap
CouchDB using [couchdb-bootstrap](https://github.com/ehealthafrica/couchdb-bootstrap)

### indices

CouchDB-compatible map/reduce functions by database & index names

### transform

Key/Value map of transformation scripts by `sourceId`s.

### validate _tbd_

Key/Value map of validation scripts by indicator `"type"`s

// handlers for integrated data
validate: {
  'accountMovement': validate
}

### service

A function that gets execute on app startup. Needs to call a
callback when finished initialisation.

```js
  service: function (kazana, callback) {
    // initialise service
    // e.g. start pulling data from some 3rd party service
    callback()
  }
```

### plugins

Array of objects with same properties as `options` for the
`Kazana` constructor.

## Scripts

### kazana-services

```
$ kazana-services 
npm start -- --only=account
npm start -- --only=raw-data
npm start -- --bare
```

Lists commands to start main app and plugins in separate processes

## Local setup and Testing

[![devDependency Status](https://david-dm.org/eHealthAfrica/kazana/dev-status.svg)](https://david-dm.org/eHealthAfrica/kazana#info=devDependencies)

```
git clone git@github.com:eHealthAfrica/kazana.git
cd kazana
npm install
npm test
```

CI test with selenium / chrome

```
npm run test:ci
```

CI test with saucelabs

```
SAUCE_USERNAME=*** SAUCE_ACCESS_KEY=*** TEST_CLIENT="saucelabs:internet explorer:10:Windows 8" npm run test:ci
```

### Credit

Brought to you by [eHealth Africa](http://ehealthafrica.org/)
— good tech for hard places.

### License

Apache-2.0
