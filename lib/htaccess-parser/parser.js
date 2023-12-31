const HtaccessFile = require('./model/HtaccessFile')
const RewriteRule = require('./model/RewriteRule')
const RewriteCond = require('./model/RewriteCond')

function Parser(content) {
  if (!Array.isArray(content)) {
    content = content.toString().split('\n')
  }

  this.content = content.filter(function (line) {
    const trimmed = line.trim()
    return (trimmed.length > 0) && (trimmed.substring(0, 1) !== '#')
  })

  return this.parseContent()
}

Parser.prototype.parseContent = function () {
  const htaccessFile = new HtaccessFile()

  let RewriteEngineActivated = false
  let conditions = []
  let flags = null

  for (let i=0; i < this.content.length; i++) {
    const line = this.content[i].trim()
    const parts = line.trim().split(' ').filter(function (part) {
      return part.length > 0
    })

    const directive = parts[0]

    switch(directive) {
      case 'RewriteEngine':
        RewriteEngineActivated = (this.stripQuotes(parts[1]).toLowerCase() === 'on')
        break

      case 'RewriteBase':
        if (RewriteEngineActivated) {
          htaccessFile.RewriteBase = this.stripQuotes(parts[1])
        }
        break

      case 'RewriteCond':
        if (RewriteEngineActivated) {
          flags = (typeof parts[3] === 'undefined' ? '' : parts[3])
          conditions.push(new RewriteCond(line, this.stripQuotes(parts[1]), this.stripQuotes(parts[2]), flags))
        }
        break

      case 'RewriteRule':
        if (RewriteEngineActivated) {
          flags = (typeof parts[3] === 'undefined' ? '' : parts[3])
          const rule = new RewriteRule(line, this.stripQuotes(parts[1]), this.stripQuotes(parts[2]), flags, conditions)

          htaccessFile.RewriteRules.push(rule)
          conditions = []
        }
        break
    }
  }

  return htaccessFile
}

Parser.prototype.stripQuotes = function (s) {
  return (/^"([^"]*)"$/.test(s) || /^'([^']*)'$/.test(s))
    ? s.slice(1, -1)
    : s
}

module.exports = function (content) {
  return (new Parser(content))
}
