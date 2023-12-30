const test_data = {
  "url":      "http://fdroid.example.com/repo/com.example.app/de/icon.png",
  "htaccess": [
    `RewriteEngine on`,
    `RewriteCond %{HTTP_REFERER} =http://example.com`,
    `RewriteCond %{SSL:SSL_CIPHER_USEKEYSIZE} =128`,
    `RewriteCond %{HTTP:ACCEPT} =text/plain`,
    `RewriteCond expr "%{HTTP:AUTHORIZATION} == 'Basic %{ENV:BASIC_AUTHORIZATION}'"`,
    `RewriteRule "^(/?(?:repo|archive))/([^/]+)/[^/]+/icon.*\\.png$" "$1/icons/$2.png" [BCTLS,PT]`,
    `RewriteRule "^/?repo/icons(?:-\\d+)?/(com\\.example\\.app)(?:\\.\\d+)?\\.png$" "http://icons.example.com/$1/icon.png" [L,R=301]`
  ],
  "variables": {
    "server": {
      "HTTP_REFERER": "http://example.com"
    },
    "environment": {
      "BASIC_AUTHORIZATION": "YWxhZGRpbjpvcGVuc2VzYW1l"
    },
    "ssl-environment": {
      "SSL_CIPHER_USEKEYSIZE": "128"
    },
    "http-header": {
      "ACCEPT":        "text/plain",
      "AUTHORIZATION": "Basic YWxhZGRpbjpvcGVuc2VzYW1l"
    }
  }
}

const test_results = htaccess_tester(test_data)

const show = (text) => {
  document.body.innerHTML = `<pre>${text}</pre>`
}

show(
  JSON.stringify(test_results, null, 2)
)
