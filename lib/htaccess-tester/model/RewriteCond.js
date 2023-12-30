// references:
//   https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html#rewritecond

const vi = require('../util/variable-interpolator')
const fv = require('../util/flag-validator')

const regexs = {
  "lexicographical-operation": /^(<|>|=|<=|>=)(.*)$/,
  "integer-operation":         /^(-eq|-ge|-gt|-le|-lt|-ne)(.*)$/
}

const supportedFlags = [
  'NC', 'nocase',
  'OR', 'ornext'
]

function RewriteCond(baseCondition) {
  Object.assign(this, baseCondition)

  this.condPatternFlags = {
    "negate": false,
    "lexicographical-operation": null,
    "integer-operation": null
  }

  if (this.condPattern && (this.condPattern[0] === '!')) {
    this.condPatternFlags['negate'] = true
    this.condPattern = this.condPattern.substring(1)
  }

  if (this.condPattern) {
    const matches = regexs["lexicographical-operation"].exec(this.condPattern)

    if (matches) {
      this.condPatternFlags['lexicographical-operation'] = matches[1]
      this.condPattern = matches[2]
    }
  }

  if (this.condPattern && !this.condPatternFlags['lexicographical-operation']) {
    const matches = regexs["integer-operation"].exec(this.condPattern)

    if (matches) {
      this.condPatternFlags['integer-operation'] = matches[1]
      this.condPattern = matches[2]
    }
  }

  if (this.condPattern && !this.condPatternFlags['lexicographical-operation'] && !this.condPatternFlags['integer-operation']) {
    this.re = this.isNC()
      ? new RegExp(this.condPattern, 'i')
      : new RegExp(this.condPattern)
  }
}

RewriteCond.prototype.runTest = function (url, variables, currentRuleMatches, previousCondMatches) {
  const log = {
    "text":         this.text,
    "is_condition": true
  }

  log.errors = this.isValid()

  if (log.errors && log.errors.length) {
    log.is_valid = false
    log.is_match = false
    return log
  }

  const resolvedTestString = vi.resolveVariables(
    this.testString,
    function(variable) {
      log.errors.push('RewriteCond TestString variable not resolved: ' + variable)
    },
    url, variables, currentRuleMatches, previousCondMatches
  )

  if (log.errors && log.errors.length) {
    log.is_valid = false
    log.is_match = false
    return log
  }

  log.is_valid = true
  log.result = {
    "TestString":       resolvedTestString,
    "CondPatternFlags": Object.assign({}, this.condPatternFlags)
  }

  if (this.condPatternFlags['lexicographical-operation']) {
    const testVal = resolvedTestString
    const condVal = this.condPattern

    switch(this.condPatternFlags['lexicographical-operation']) {
      case '<':
        log.is_match = (testVal < condVal)
        break
      case '>':
        log.is_match = (testVal > condVal)
        break
      case '=':
        log.is_match = (testVal == condVal)
        break
      case '<=':
        log.is_match = (testVal <= condVal)
        break
      case '>=':
        log.is_match = (testVal >= condVal)
        break
      default:
        log.is_match = false
    }
  }

  else if (this.condPatternFlags['integer-operation']) {
    const testVal = parseInt(resolvedTestString, 10)
    const condVal = parseInt(this.condPattern,   10)

    switch(this.condPatternFlags['lexicographical-operation']) {
      case '-eq':
        log.is_match = (testVal == condVal)
        break
      case '-ge':
        log.is_match = (testVal >= condVal)
        break
      case '-gt':
        log.is_match = (testVal > condVal)
        break
      case '-le':
        log.is_match = (testVal <= condVal)
        break
      case '-lt':
        log.is_match = (testVal < condVal)
        break
      case '-ne':
        log.is_match = (testVal != condVal)
        break
      default:
        log.is_match = false
    }
  }

  else {
    matches = this.re.exec(resolvedTestString)

    log.is_match = !!matches

    if (matches)
      log.result.matches = matches.slice()
  }

  if (this.condPatternFlags['negate'])
    log.is_match = !log.is_match

  return log
}

RewriteCond.prototype.isValid = function () {
  const errors = []

  this.isValidTestString(errors)
  this.isValidFlags(errors)

  return errors
}

RewriteCond.prototype.isValidTestString = function (errors) {
  // special case
  if (this.testString === 'expr') {
    errors.push('RewriteCond TestString not supported: ' + this.testString)
    return
  }

  vi.isValid(
    this.testString,
    function(variable) {
      errors.push('RewriteCond TestString variable not supported: ' + variable)
    }
  )
}

RewriteCond.prototype.isValidFlags = function (errors) {
  fv.isValid(
    this.flags,
    supportedFlags,
    function(flag) {
      errors.push('RewriteCond flag not supported: ' + flag)
    }
  )
}

RewriteCond.prototype.isNC = function () {
  return fv.hasFlag(this.flags, 'NC')
    ||   fv.hasFlag(this.flags, 'nocase')
}

RewriteCond.prototype.isOR = function () {
  return fv.hasFlag(this.flags, 'OR')
    ||   fv.hasFlag(this.flags, 'ornext')
}

module.exports = RewriteCond
