/**
 * Custom Next.js server with HTTPS support for local development.
 *
 * Uses self-signed certificates generated with OpenSSL.
 * The browser will show a warning about the certificate — click "Advanced"
 * and "Proceed to localhost (unsafe)" to continue.
 */

const { createServer } = require('https');
const { parse } = require('url');
const { readFileSync } = require('fs');
const { join } = require('path');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: readFileSync(join(__dirname, 'certs', 'localhost.key')),
  cert: readFileSync(join(__dirname, 'certs', 'localhost.crt')),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, () => {
    console.log(`\n  ✓ HTTPS server ready at https://${hostname}:${port}`);
    console.log(`  (Browser will show a warning — click "Advanced" → "Proceed")\n`);
  });
});
