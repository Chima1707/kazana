module.exports = {
  views: {
    submissions: {
      map: require('./map'),
      reduce: '_count'
    }
  },
  filters: {
    pending: require('./filter')
  }
}
