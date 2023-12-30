const htaccess_tester = require('../..')

const https = require('https')

const download_url = function(url) {
  return new Promise((resolve, reject) => {
    https.get(url, function(res) {
      if ((res.statusCode < 200) || (res.statusCode >= 300)) {
        reject(new Error(`status code: ${res.statusCode}`))
      }
      else {
        res.setEncoding('utf8')

        let text = ''
        res.on('data', (chunk) => {text += chunk})
        res.on('end',  () => {resolve(text)})
      }
    })
  })
}

download_url('https://raw.githubusercontent.com/warren-bank/fdroid/apache-htdocs/htdocs/.htaccess')
.then((htaccess) => {
  const test_data    = {"url": "https://warren-bank.orgfree.com/repo/com.github.warren_bank.webmonkey/fr/icon.png", htaccess}
  const test_results = htaccess_tester(test_data)

  console.log(
    JSON.stringify(test_results, null, 2)
  )
})
.catch((error) => {
  console.log('ERROR:', error.message)
})
