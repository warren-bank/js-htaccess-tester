### [htaccess-tester](https://github.com/warren-bank/js-htaccess-tester)

Apache .htaccess Tester

#### Usage:

```javascript
  const htaccess_tester = require('@warren-bank/htaccess-tester')

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

  console.log(
    JSON.stringify(test_results, null, 2)
  )
```

__Output:__ [log file](./tests/01-README/test.log)

- - - -

#### Browser Build

__CDN links:__

* [unpkg.com](https://unpkg.com/@warren-bank/htaccess-tester@latest/browser-build/dist/es5/htaccess-tester.js)
* [jsdelivr.net](https://cdn.jsdelivr.net/npm/@warren-bank/htaccess-tester@latest/browser-build/dist/es5/htaccess-tester.js)

__Usage:__

```html
  <html>
    <head>
      <script src="./browser-build/dist/es5/htaccess-tester.js"></script>
      <script>
        // abbreviated.. same data structure as the previous example:
        const test_data = {url, htaccess, variables}

        const test_results = window.htaccess_tester(test_data)
      </script>
    </head>
  </html>
```

__Example:__ [HTML file](./browser-build/tests/01-README/test.html) &rarr; [raw.githack.com](https://raw.githack.com/warren-bank/js-htaccess-tester/master/browser-build/tests/01-README/test.html)

- - - -

#### Inspiration:

* library: `htaccess-parser`
  - author: [Mickael Burguet](https://github.com/rundef)
  - [npm](https://www.npmjs.com/package/htaccess-parser)
  - [github](https://github.com/rundef/node-htaccess-parser)
  - license: [MIT](https://github.com/rundef/node-htaccess-parser/blob/87755ae00789f46ca55202455f9250d8949fd6c0/package.json#L24)
  - notes:
    * this library serves as a foundation for converting lines of text in .htaccess file format to object models
* library: `express-htaccess-middleware`
  - author: [Mickael Burguet](https://github.com/rundef)
  - [npm](https://www.npmjs.com/package/express-htaccess-middleware)
  - [github](https://github.com/rundef/node-express-htaccess-middleware)
  - license: [MIT](https://github.com/rundef/node-express-htaccess-middleware/blob/8731a45853c90a93c37434649b28d0b80d2025ab/package.json#L25)
  - notes:
    * this library has an entirely different purpose, but I used its overall design as a starting point
* client-side user interface
  - author: [madewithlove.com](https://github.com/madewithlove)
  - [web](https://htaccess.madewithlove.com/)
  - [api](https://htaccess.madewithlove.com/api)
  - notes:
    * this is a great utility, but all of its work is performed by a closed-source api backend
    * I designed my [SPA front-end](https://warren-bank.github.io/single-page-apps/htaccess-tester/index.html) user interface to look similar,<br>and all of its work is performed by client-side JS

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
