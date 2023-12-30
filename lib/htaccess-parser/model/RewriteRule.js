function RewriteRule(text, pattern, substitution, flags, conditions) {
  this.text         = text
  this.pattern      = pattern
  this.substitution = substitution
  this.flags        = flags.replace('[', '').replace(']', '').split(',')
    .map(Function.prototype.call, String.prototype.trim)
    .filter(function (flag) {
      return (flag.length > 0)
    })
  this.conditions   = conditions || []
}

module.exports = RewriteRule
