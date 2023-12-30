function RewriteCond(text, testString, condPattern, flags) {
  this.text        = text
  this.testString  = testString
  this.condPattern = condPattern
  this.flags       = flags.replace('[', '').replace(']', '').split(',')
    .map(Function.prototype.call, String.prototype.trim)
    .filter(function (flag) {
      return (flag.length > 0)
    })
}

module.exports = RewriteCond
