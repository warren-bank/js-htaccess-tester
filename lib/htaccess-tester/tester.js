const RewriteRule    = require('./model/RewriteRule')
const fh             = require('./util/file-helper')
const uh             = require('./util/url-helper')
const htaccessParser = require('../htaccess-parser/parser')

function HtaccessTester(test_data) {
  this.test_data = test_data

  return this.runTest()
}

HtaccessTester.prototype.runTest = function () {
  this.test_results = {}

  try {
    this.parseContent()

    fh.setRewriteBase(
      this.htaccessFile.RewriteBase
    )

    this.rules = []
    for (let i=0; i < this.htaccessFile.RewriteRules.length; i++) {
      const rule = new RewriteRule(
        this.htaccessFile.RewriteRules[i]
      )
 
     this.rules.push(rule)
    }

    const {result, log} = this.processAllRules(
      this.test_data.url,
      this.test_data.variables
    )

    this.test_results.success = true
    this.test_results.result  = result
    this.test_results.log     = log
  }
  catch(e) {
    this.test_results.success = false
    this.test_results.error   = e.message
  }

  return this.test_results
}

HtaccessTester.prototype.parseContent = function () {
  let htaccessContent = this.test_data.htaccess

  this.htaccessFile = htaccessParser(htaccessContent)
}

HtaccessTester.prototype.processAllRules = function (url, variables) {
  uh.parse_url(url)

  const allLogs   = []
  let finalResult = null
  let skip_count  = 0

  for (let i=0; i < this.rules.length; i++) {
    const rule     = this.rules[i]
    const someLogs = rule.runAllTests(url, variables)

    if (!someLogs || !someLogs.length) continue
    allLogs.push(someLogs)

    const log = someLogs[someLogs.length - 1]

    if (skip_count > 0) {
      log.is_skipped = true
      skip_count--
      continue
    }

    if (!log.is_valid || !log.is_match) continue

    if (log.result)
      finalResult = log.result

    if (log.result && log.result.skip_count)
      skip_count += log.result.skip_count

    if (log.result && log.result.url) {
      log.result.file_path = fh.get_resolved_filepath(log.result.url)
      log.result.url       = uh.get_resolved_url(log.result.url)
      url = log.result.url

      if (log.is_passthrough) {
        const data = this.processAllRules(url, variables)

        log['passthrough'] = data.log
        finalResult = data.result || finalResult
        break
      }
    }

    if (log.result && log.result.status_code && !log.is_redirect) break

    if (log.is_last) break
  }

  return {
    "result": finalResult,
    "log":    Array.prototype.concat.apply([], allLogs)
  }
}

module.exports = function (test_data) {
  return (new HtaccessTester(test_data))
}
