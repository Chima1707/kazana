var path = require('path')

module.exports = {
  name: 'kazana',
  version: require('./package.json').version,
  static: path.resolve(__dirname, 'public'),
  bootstrap: path.resolve(__dirname, 'bootstrap'),
  plugins: [
    require('kazana-account'),
    require('kazana-raw-data')
  ]
}
