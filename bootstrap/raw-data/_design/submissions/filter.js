module.exports = function (doc, req) {
  if (doc._deleted) return true
  if (doc.type !== 'dataReport') return false
  if (doc.transformedAt) return false

  return doc.sourceId === req.query.sourceId
}
