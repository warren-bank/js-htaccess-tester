const url_parse = require('url').parse
const uh        = require('./url-helper')

const regexs = {
  "backref-rule-variable":     /\$([0-9])/g,
  "backref-cond-variable":     /%([0-9])/g,

  "server-variable":           /%{(API_VERSION|AUTH_TYPE|CONN_REMOTE_ADDR|CONN_REMOTE_ADDR|CONTEXT_DOCUMENT_ROOT|CONTEXT_PREFIX|DOCUMENT_ROOT|HTTPS|HTTP_ACCEPT|HTTP_COOKIE|HTTP_FORWARDED|HTTP_HOST|HTTP_PROXY_CONNECTION|HTTP_REFERER|HTTP_USER_AGENT|IPV6|IS_SUBREQ|PATH_INFO|QUERY_STRING|REMOTE_ADDR|REMOTE_ADDR|REMOTE_HOST|REMOTE_IDENT|REMOTE_PORT|REMOTE_USER|REQUEST_FILENAME|REQUEST_METHOD|REQUEST_SCHEME|REQUEST_URI|SCRIPT_FILENAME|SCRIPT_GROUP|SCRIPT_USER|SERVER_ADDR|SERVER_ADMIN|SERVER_NAME|SERVER_PORT|SERVER_PROTOCOL|SERVER_SOFTWARE|THE_REQUEST|TIME|TIME_DAY|TIME_HOUR|TIME_MIN|TIME_MON|TIME_SEC|TIME_WDAY|TIME_YEAR)}/g,
  "environment-variable":      /%{ENV:([^}]+)}/g,
  "ssl-environment-variable":  /%{SSL:(API_VERSION|AUTH_TYPE|DOCUMENT_ROOT|HTTPS|HTTP_ACCEPT|HTTP_COOKIE|HTTP_FORWARDED|HTTP_HOST|HTTP_PROXY_CONNECTION|HTTP_REFERER|HTTP_USER_AGENT|IS_SUBREQ|PATH_INFO|QUERY_STRING|REMOTE_ADDR|REMOTE_HOST|REMOTE_IDENT|REMOTE_USER|REQUEST_FILENAME|REQUEST_METHOD|REQUEST_SCHEME|REQUEST_URI|SERVER_ADMIN|SERVER_NAME|SERVER_PORT|SERVER_PROTOCOL|SERVER_SOFTWARE|SSL_CIPHER|SSL_CIPHER_ALGKEYSIZE|SSL_CIPHER_EXPORT|SSL_CIPHER_USEKEYSIZE|SSL_CLIENT_A_KEY|SSL_CLIENT_A_SIG|SSL_CLIENT_CERT|SSL_CLIENT_CERT_CHAIN_n|SSL_CLIENT_CERT_RFC4523_CEA|SSL_CLIENT_I_DN|SSL_CLIENT_I_DN_x509|SSL_CLIENT_M_SERIAL|SSL_CLIENT_M_VERSION|SSL_CLIENT_SAN_DNS_n|SSL_CLIENT_SAN_Email_n|SSL_CLIENT_SAN_OTHER_msUPN_n|SSL_CLIENT_S_DN|SSL_CLIENT_S_DN_x509|SSL_CLIENT_VERIFY|SSL_CLIENT_V_END|SSL_CLIENT_V_REMAIN|SSL_CLIENT_V_START|SSL_COMPRESS_METHOD|SSL_PROTOCOL|SSL_SECURE_RENEG|SSL_SERVER_A_KEY|SSL_SERVER_A_SIG|SSL_SERVER_CERT|SSL_SERVER_I_DN|SSL_SERVER_I_DN_x509|SSL_SERVER_M_SERIAL|SSL_SERVER_M_VERSION|SSL_SERVER_SAN_DNS_n|SSL_SERVER_SAN_Email_n|SSL_SERVER_SAN_OTHER_dnsSRV_n|SSL_SERVER_S_DN|SSL_SERVER_S_DN_x509|SSL_SERVER_V_END|SSL_SERVER_V_START|SSL_SESSION_ID|SSL_SESSION_RESUMED|SSL_SRP_USER|SSL_SRP_USERINFO|SSL_TLS_SNI|SSL_VERSION_INTERFACE|SSL_VERSION_LIBRARY|THE_REQUEST|TIME|TIME_DAY|TIME_HOUR|TIME_MIN|TIME_MON|TIME_SEC|TIME_WDAY|TIME_YEAR)}/g,
  "http-header-variable":      /%{HTTP:([^}]+)}/g,

  "generic-variable":          /%{[^}]*}/g
}

const get_regex = function(key) {
  const regex = regexs[key]

  if (regex.global)
    regex.lastIndex = 0

  return regex
}

const get_supportedVariables = function() {
  return [
    get_regex('server-variable'),
    get_regex('environment-variable'),
    get_regex('ssl-environment-variable'),
    get_regex('http-header-variable')
  ]
}

const isValid = function (testString, errorCallback) {
  if (!testString || (typeof errorCallback !== 'function')) return

  const all_variables = []
  let regex, matches

  regex = get_regex('generic-variable')
  while (matches = regex.exec(testString)) {
    all_variables.push(matches[0])
  }

  if (all_variables.length) {
    const supportedVariables = get_supportedVariables()

    for (let i=0; i < all_variables.length; i++) {
      const variable = all_variables[i]
      let isSupported = false

      for (let j=0; j < supportedVariables.length; j++) {
        regex = supportedVariables[j]

        if (regex.test(variable)) {
          isSupported = true
          break
        }
      }

      if (!isSupported) {
        errorCallback(variable)
      }
    }
  }
}

const resolveVariables = function(testString, errorCallback, url, variables, currentRuleMatches, previousCondMatches, flags) {
  if (!testString || (typeof errorCallback !== 'function')) return

  if (!variables)
    variables = {}

  addUrlDerivedVariables(url, variables)

  const variableKeys = ['backref-rule', 'backref-cond', 'server', 'environment', 'ssl-environment', 'http-header']
  let resolvedTestString = testString
  let variableKey, regex, matches, variableExpression, unresolvedVariable, resolvedVariable

  for (let i=0; i < variableKeys.length; i++) {
    variableKey = variableKeys[i]
    regex       = get_regex(variableKey + '-variable')

    while (matches = regex.exec(testString)) {
      variableExpression = matches[0]
      unresolvedVariable = matches[1]

      try {
        switch(variableKey) {
          case 'backref-rule': {
              const backref_index = parseInt(unresolvedVariable, 10)
              resolvedVariable    = currentRuleMatches[backref_index]
              resolvedVariable    = uh.format_backref_value(resolvedVariable, flags)
            }
            break
          case 'backref-cond': {
              const backref_index = parseInt(unresolvedVariable, 10)
              resolvedVariable    = previousCondMatches[backref_index]
              resolvedVariable    = uh.format_backref_value(resolvedVariable, flags)
            }
            break
          default:
            resolvedVariable = variables[variableKey][unresolvedVariable]
            break
        }

        if (resolvedVariable === undefined) throw ''

        resolvedTestString = resolvedTestString.replaceAll(variableExpression, resolvedVariable)
      }
      catch(e) {
        errorCallback(variableExpression)
      }
    }
  }

  return resolvedTestString
}

const addUrlDerivedVariables = function(url, variables) {
  if (!url) return

  if (!variables['server'])
    variables['server'] = {}

  if (!variables['ssl-environment'])
    variables['ssl-environment'] = {}

  const parts = url_parse(url)

  variables['server']['REQUEST_URI']  = parts.pathname
  variables['server']['QUERY_STRING'] = parts.query
  variables['server']['THE_REQUEST']  = url

  variables['ssl-environment']['REQUEST_URI']  = parts.pathname
  variables['ssl-environment']['QUERY_STRING'] = parts.query
  variables['ssl-environment']['THE_REQUEST']  = url
}

module.exports = {
  isValid,
  resolveVariables
}
