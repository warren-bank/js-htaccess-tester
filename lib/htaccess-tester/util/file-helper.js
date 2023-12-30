let RewriteBase = '/'

const setRewriteBase = function(rb) {
  RewriteBase = rb || '/'
}

const get_resolved_filepath = function(relative_path) {
  if (!relative_path)
    relative_path = ''
  if (relative_path.substring(0,4).toLowerCase() === 'http')
    return null

  return (RewriteBase && (relative_path.indexOf(RewriteBase) !== 0))
    ? (RewriteBase + '/' + relative_path).replace(/[\/]{2,}/g, '/')
    : relative_path
}

module.exports = {
  setRewriteBase,
  get_resolved_filepath
}
