const htaccess_tester = require('../..')

const test_data = {
  "url":      "http://test.example.com:80/foo/bar.baz?hello=world",
  "htaccess": [
    `RewriteEngine on`,

    `RewriteCond %{SERVER_PORT} -gt70`,
    `RewriteCond %{SERVER_PORT} -ge70`,
    `RewriteCond %{SERVER_PORT} -ne70`,
    `RewriteCond %{SERVER_PORT} -ge80`,
    `RewriteCond %{SERVER_PORT} -eq80`,
    `RewriteCond %{SERVER_PORT} -le80`,
    `RewriteCond %{SERVER_PORT} -ne90`,
    `RewriteCond %{SERVER_PORT} -le90`,
    `RewriteCond %{SERVER_PORT} -lt90`,

    `RewriteCond %{SERVER_PORT} -gt90`,
    `RewriteCond %{SERVER_PORT} -ge90`,
    `RewriteCond %{SERVER_PORT} -ne80`,
    `RewriteCond %{SERVER_PORT} -le70`,
    `RewriteCond %{SERVER_PORT} -lt70`,

    `RewriteRule "^(.*)$" -`
  ],
  "variables": {
    "server": {
      "SERVER_PORT": "80"
    }
  }
}

const test_results = htaccess_tester(test_data)

console.log(
  JSON.stringify(test_results, null, 2)
)
