// references:
//   https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html#rewriterule

const RewriteCond = require('./RewriteCond')
const vi          = require('../util/variable-interpolator')
const fv          = require('../util/flag-validator')
const fh          = require('../util/file-helper')
const uh          = require('../util/url-helper')

const supportedFlags = [
  'B', /^B=(.+)$/,
  'BCTLS',
  /^BNE=(.+)$/,
  'BNP', 'backrefnoplus',
  'END',
  'F', 'forbidden',
  'G', 'gone',
  'L', 'last',
  'N', /^N=(\d+)$/, 'next', /^next=(\d+)$/,
  'NC', 'nocase',
  'PT', 'passthrough',
  'QSA', 'qsappend',
  'QSD', 'qsdiscard',
  'QSL', 'qslast',
  'R', /^R=(\d{3})$/, 'redirect', /^redirect=(\d{3})$/,
  'S', /^S=(\d+)$/, 'skip', /^skip=(\d+)$/,
  /^T=(.+)$/, /^type=(.+)$/
]

function RewriteRule(baseRule) {
  Object.assign(this, baseRule)

  for (let i=0; i < this.conditions.length; i++) {
    this.conditions[i] = new RewriteCond(this.conditions[i])
  }

  this.re = this.isNC()
    ? new RegExp(this.pattern, 'i')
    : new RegExp(this.pattern)
}

RewriteRule.prototype.runAllTests = function (url, variables) {
  const currentRuleMatches = this.re.exec(uh.get_parsed_pathname(true, true))
  let previousCondMatches  = null
  const logs = []

  for (let i=0; i < this.conditions.length; i++) {
    const log = this.conditions[i].runTest(url, variables, currentRuleMatches, previousCondMatches)

    previousCondMatches = (log.result && log.result.matches)
      ? log.result.matches
      : null

    logs.push(log)
  }

  logs.push(
    this.runTest(url, variables, currentRuleMatches, previousCondMatches, this.doAllConditionsMatch(logs))
  )

  return logs
}

RewriteRule.prototype.runTest = function (url, variables, currentRuleMatches, previousCondMatches, allConditionsMatch) {
  const log = {
    "text":         this.text,
    "is_condition": false
  }

  log.errors = this.isValid()

  if (log.errors && log.errors.length) {
    log.is_valid = false
    log.is_match = false
    return log
  }

  let new_url
  if (this.substitution === '-') {
    new_url = url
  }
  else {
    const resolvedSubstitutionString = vi.resolveVariables(
      this.substitution,
      function(variable, variableKey) {
        if ((variableKey === 'backref-rule') && !currentRuleMatches) return

        log.errors.push('RewriteRule Substitution variable not resolved: ' + variable)
      },
      url, variables, currentRuleMatches, previousCondMatches,
      this.get_backref_format_flags()
    )

    new_url = uh.update_querystring(
      url, resolvedSubstitutionString,
      this.isQSL(), this.isQSD(), this.isQSA()
    )
  }

  if (log.errors && log.errors.length) {
    log.is_valid = false
    log.is_match = false
    return log
  }

  log.is_valid = true
  log.is_match = !!currentRuleMatches
  log.all_conditions_match = allConditionsMatch
  log.result = {
    "url":         new_url,
    "status_code": (this.getStatusCode() || this.getRedirectStatusCode() || null),
    "mime_type":   this.getMimeType(),
    "skip_count":  this.getSkipCount()
  }

  if (currentRuleMatches)
    log.result.matches = currentRuleMatches.slice()

  log.is_redirect = (
       log.result.status_code
   && (log.result.status_code >= 300)
   && (log.result.status_code <  400)
  )

  if (!log.is_redirect && uh.is_redirect_url(new_url)) {
    log.is_redirect        = true
    log.result.status_code = 302
  }

  log.is_passthrough = this.isPassThrough()
  log.is_last        = this.isLast()

  let nextCount = (!log.is_valid || !log.is_match || (this.substitution === '-'))
    ? 0
    : this.getNextCount()

  while ((nextCount > 0) && this.runNext(log, variables, previousCondMatches)) {
    nextCount--
  }

  return log
}

RewriteRule.prototype.runNext = function (log, variables, previousCondMatches) {
  const currentRuleMatches = this.re.exec(uh.trim_lead_slash(log.result.url))
  if (!currentRuleMatches) return false

  const url = uh.get_resolved_url(log.result.url)
  let OK = true

  const resolvedSubstitutionString = vi.resolveVariables(
    this.substitution,
    function(variable) {
      OK = false
    },
    url, variables, currentRuleMatches, previousCondMatches,
    this.get_backref_format_flags()
  )

  const new_url = uh.update_querystring(
    url, resolvedSubstitutionString,
    this.isQSL(), this.isQSD(), this.isQSA()
  )

  if (OK) {
    if (!log.result['next'])
      log.result['next'] = {"count": 0, "iterations": []}

    log.result['next'].count++
    log.result['next'].iterations.push({
      "url":       url,
      "file_path": fh.get_resolved_filepath(log.result.url),
      "matches":   log.result.matches
    })

    log.result.url     = new_url
    log.result.matches = currentRuleMatches.slice()
  }

  return OK
}

RewriteRule.prototype.isValid = function () {
  const errors = []

  this.isValidSubstitutionString(errors)
  this.isValidFlags(errors)

  return errors
}

RewriteRule.prototype.isValidSubstitutionString = function (errors) {
  vi.isValid(
    this.substitution,
    function(variable) {
      errors.push('RewriteRule Substitution variable not supported: ' + variable)
    }
  )
}

RewriteRule.prototype.isValidFlags = function (errors) {
  fv.isValid(
    this.flags,
    supportedFlags,
    function(flag) {
      errors.push('RewriteRule flag not supported: ' + flag)
    }
  )
}

RewriteRule.prototype.doAllConditionsMatch = function (logs) {
  const state = {
    currentIsOr:    false,
    prevWasOr:      false,
    orConditionMet: false
  }

  for (let i=0; i < this.conditions.length; i++) {
    state.currentIsOr = this.conditions[i].isOR()

    // one of the OR condition has been met
    if (state.prevWasOr && state.orConditionMet) {
      state.prevWasOr      = state.currentIsOr
      state.orConditionMet = state.currentIsOr
      continue
    }

    // condition isn't met
    if (!logs[i].is_match) {
      if (state.currentIsOr) {
        continue
      }
      else {
        return false
      }
    }
    else if (state.currentIsOr) {
      state.orConditionMet = true
      state.prevWasOr      = state.currentIsOr
    }
  }

  return true
}

RewriteRule.prototype.getStatusCode = function () {
  if (
         (this.flags.indexOf('F')         !== -1)
    ||   (this.flags.indexOf('forbidden') !== -1)
  )
    return 403

  if (
         (this.flags.indexOf('G')    !== -1)
    ||   (this.flags.indexOf('gone') !== -1)
  )
    return 410

  return 0
}

RewriteRule.prototype.getRedirectStatusCode = function () {
  return fv.getFlagIntegerValue(this.flags, 'R',        302)
    ||   fv.getFlagIntegerValue(this.flags, 'redirect', 302)
}

RewriteRule.prototype.getSkipCount = function () {
  return fv.getFlagIntegerValue(this.flags, 'S',    0)
    ||   fv.getFlagIntegerValue(this.flags, 'skip', 0)
}

RewriteRule.prototype.getNextCount = function () {
  return fv.getFlagIntegerValue(this.flags, 'N',    10000)
    ||   fv.getFlagIntegerValue(this.flags, 'next', 10000)
}

RewriteRule.prototype.getMimeType = function () {
  return fv.getFlagStringValue(this.flags, 'T')
    ||   fv.getFlagStringValue(this.flags, 'type')
}

RewriteRule.prototype.getB = function () {
  return fv.getFlagStringValue(this.flags, 'B')
    ||   fv.hasFlag(this.flags, 'B')
}

RewriteRule.prototype.getBNE = function () {
  return fv.getFlagStringValue(this.flags, 'BNE')
}

RewriteRule.prototype.isBCTLS = function () {
  return fv.hasFlag(this.flags, 'BCTLS')
}

RewriteRule.prototype.isBNP = function () {
  return fv.hasFlag(this.flags, 'BNP')
    ||   fv.hasFlag(this.flags, 'backrefnoplus')
}

RewriteRule.prototype.isNC = function () {
  return fv.hasFlag(this.flags, 'NC')
    ||   fv.hasFlag(this.flags, 'nocase')
}

RewriteRule.prototype.isQSA = function () {
  return fv.hasFlag(this.flags, 'QSA')
    ||   fv.hasFlag(this.flags, 'qsappend')
}

RewriteRule.prototype.isQSD = function () {
  return fv.hasFlag(this.flags, 'QSD')
    ||   fv.hasFlag(this.flags, 'qsdiscard')
}

RewriteRule.prototype.isQSL = function () {
  return fv.hasFlag(this.flags, 'QSL')
    ||   fv.hasFlag(this.flags, 'qslast')
}

RewriteRule.prototype.isPassThrough = function () {
  return fv.hasFlag(this.flags, 'PT')
    ||   fv.hasFlag(this.flags, 'passthrough')
}

RewriteRule.prototype.isLast = function () {
  return fv.hasFlag(this.flags, 'L')
    ||   fv.hasFlag(this.flags, 'last')
    ||   fv.hasFlag(this.flags, 'END')
}

RewriteRule.prototype.get_backref_format_flags = function () {
  return {
    "B":     this.getB(),
    "BNE":   this.getBNE(),
    "BCTLS": this.isBCTLS(),
    "BNP":   this.isBNP()
  }
}

module.exports = RewriteRule
