/* global emit */
module.exports = function (doc) {
  if (doc.type !== 'dataReport') return;
  if (isPending(doc)) {
    emit(['byState', 'pending', doc.sourceId], null);
    emit(['byUser', doc.createdBy.id, 'pending', doc.sourceId], null);
  }
  if (hasErrors(doc)) {
    emit(['byState', 'withErrors', doc.sourceId], null);
    emit(['byUser', doc.createdBy.id, 'withErrors', doc.sourceId], null);
  }
  if (isTransformed(doc)) {
    emit(['byState', 'transformed', doc.sourceId], null);
    emit(['byUser', doc.createdBy.id, 'transformed', doc.sourceId], null);
  }

  function isPending (doc) {
    return !doc.transformedAt;
  }
  function hasErrors (doc) {
    return !!doc.transformationErrors;
  }
  function isTransformed (doc) {
    return !isPending(doc) && !doc.transformationErrors;
  }
};
