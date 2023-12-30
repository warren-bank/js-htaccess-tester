const isValid = function (flags, supportedFlags, errorCallback) {
  if (!Array.isArray(supportedFlags) || !supportedFlags.length || (typeof errorCallback !== 'function')) return

  for (let i=0; i < flags.length; i++) {
    const flag = flags[i]
    let isSupported = false

    for (let j=0; j < supportedFlags.length; j++) {
      const supportedFlag = supportedFlags[j]

      if (supportedFlag instanceof RegExp) {
        if (supportedFlag.exec(flag)) {
          isSupported = true
          break
        }
      }
      else if (supportedFlag === flag) {
        isSupported = true
        break
      }
    }

    if (!isSupported) {
      errorCallback(flag)
    }
  }
}

const getFlagIntegerValue = function(flags, flag, defaultValue) {
  let value = getFlagStringValue(flags, flag)

  return value
    ? parseInt(value, 10)
    : (defaultValue && hasFlag(flags, flag))
        ? defaultValue
        : 0
}

const getFlagStringValue = function(flags, flag) {
  for (let i=0; i < flags.length; i++) {
    if (flags[i].indexOf(flag + '=') === 0) {
      return flags[i].substring((flag.length + 1))
    }
  }

  return ''
}

const hasFlag = function(flags, flag) {
  return (flags.indexOf(flag) !== -1)
}

module.exports = {
  isValid,
  getFlagIntegerValue,
  getFlagStringValue,
  hasFlag
}
