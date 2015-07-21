# kazana

> A modular data warehouse system

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

### Credit

Brought to you by [eHealth Africa](http://ehealthafrica.org/)
— good tech for hard places.

### License

Apache-2.0
