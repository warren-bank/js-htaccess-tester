const url_parse   = require('url').parse
const url_resolve = require('url').resolve

// -----------------------------------------------------------------------------

const update_querystring = function(old_url, new_url, QSL, QSD, QSA) {
  const old_query = parse_querystring(old_url, QSL)
  const new_query = parse_querystring(new_url, QSL)

  if (!old_query)
    return new_url

  if (!new_query) {
    return QSD
      ? new_url
      : (new_url + '?' + old_query)
  }
  else {
    return QSA
      ? (new_url + '&' + old_query)
      : new_url
  }
}

const parse_querystring = function(url, QSL) {
  const index = QSL
    ? url.lastIndexOf('?')
    : url.indexOf('?')

  const query = ((index >= 0) && (index < (url.length - 1)))
    ? url.substring(index + 1)
    : ''

  return query
}

// -----------------------------------------------------------------------------

let parsed_url  = null

const parse_url = function(url) {
  if (url && (!parsed_url || (parsed_url.href !== url))) {
    const parts = url_parse(url)
    if (!parts || !parts.protocol || !parts.hostname) return

    parsed_url = parts
  }
}

const get_parsed_url = function() {
  return parsed_url
}

const get_parsed_pathname = function(should_trim_lead_slash, should_unescape) {
  if (!parsed_url || !parsed_url.pathname) return ''

  let pathname = parsed_url.pathname

  if (should_trim_lead_slash)
    pathname = trim_lead_slash(pathname)

  if (should_unescape)
    pathname = decodeURI(pathname)

  return pathname
}

const trim_lead_slash = function(pathname) {
  return (pathname && (pathname[0] === '/'))
    ? pathname.substring(1)
    : pathname
}

const get_resolved_url = function(relative_path) {
  if (!relative_path)
    relative_path = ''
  if ((relative_path.substring(0,4).toLowerCase() !== 'http') && (!relative_path || (relative_path[0] !== '/')))
    relative_path = '/' + relative_path

  return parsed_url
    ? url_resolve(parsed_url.href, relative_path)
    : to
}

const is_redirect_url = function(new_url) {
  if (!parsed_url) return false

  const parts = url_parse(new_url)
  if (!parts || !parts.protocol || !parts.hostname) return false

  return (parts.protocol !== parsed_url.protocol) || (parts.host !== parsed_url.host)
}

// -----------------------------------------------------------------------------

const format_backref_value = function(backref_value, flags) {
  if (!backref_value || !flags)
    return backref_value

  if (!flags.B && !flags.BCTLS)
    return backref_value

  let whitelist = ''
  let blacklist = flags.BNE || ''

  if (flags.B) {
    if (typeof flags.B === 'string') {
      // user defined
      whitelist = flags.B
    } else {
      // all characters outside ASCII ranges: 48-57, 65-90, 97-122
      whitelist = '^0-9A-Za-z'
    }
  }
  else {
    // flags.BCTLS
    // all characters inside ASCII range: 0-32,127
    whitelist = '\\x00-\\x20\\x7f'
  }

  return escape_backref_value(backref_value, whitelist, blacklist, flags.BNP)
}

const escape_backref_value = function(backref_value, whitelist, blacklist, BNP) {
  const wl_regex = new RegExp(`[${whitelist}]`, 'g')
  const bl_regex = new RegExp(`[${blacklist}]`)

  return backref_value.replace(wl_regex, function(c) {
    if (bl_regex.test(c))
      return c

    if ((c === ' ') && !BNP)
      return '+'

    return `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  })
}

// -----------------------------------------------------------------------------

module.exports = {
  update_querystring,
  parse_querystring,
  parse_url,
  get_parsed_url,
  get_parsed_pathname,
  trim_lead_slash,
  get_resolved_url,
  is_redirect_url,
  format_backref_value
}
