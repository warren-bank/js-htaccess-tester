const download_url = function(url) {
  return fetch(url).then(res => res.text())
}

const show = (text) => {
  document.body.innerHTML = `<pre>${text}</pre>`
}

download_url('https://raw.githubusercontent.com/warren-bank/fdroid/apache-htdocs/htdocs/.htaccess')
.then((htaccess) => {
  const test_data    = {"url": "https://warren-bank.orgfree.com/repo/com.github.warren_bank.webmonkey/fr/icon.png", htaccess}
  const test_results = htaccess_tester(test_data)

  show(
    JSON.stringify(test_results, null, 2)
  )
})
.catch((error) => {
  show('ERROR: ' + error.message)
})
