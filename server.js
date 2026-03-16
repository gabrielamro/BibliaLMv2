import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3010;
const DIST_DIR = path.join(__dirname, 'dist');

const MIMES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const compress = compression();

const server = http.createServer((req, res) => {
  compress(req, res, () => {
    handleRequest(req, res);
  });
});

function handleRequest(req, res) {
  // --- HEALTH CHECK ---
  if (req.url === '/healthz') {
    res.writeHead(200);
    res.end('OK');
    return;
  }

  // --- WEBHOOK HANDLER ---
  if (req.url === '/api/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      console.log('[Webhook] Recebido:', body);
      res.writeHead(200);
      res.end('OK');
    });
    return;
  }

  // --- PROXY HANDLER (MERCADO PAGO) ---
  if (req.url.startsWith('/api/mp')) {
    // Remove o prefixo local e mantém o caminho original da API MP
    // Ex: /api/mp/preapproval -> /preapproval
    // Ex: /api/mp/v1/payments -> /v1/payments
    const targetPath = req.url.replace(/^\/api\/mp/, '');

    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: targetPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: 'api.mercadopago.com',
        connection: 'keep-alive'
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
      console.error('[Proxy Error]:', e);
      res.writeHead(502);
      res.end(JSON.stringify({ error: 'Gateway Error' }));
    });

    req.pipe(proxyReq);
    return;
  }

  // --- STATIC FILE HANDLER ---
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join(DIST_DIR, pathname);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const index = path.join(DIST_DIR, 'index.html');
      fs.readFile(index, (err, content) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      });
    } else {
      const ext = path.extname(filePath);
      fs.readFile(filePath, (err, content) => {
        res.writeHead(200, { 'Content-Type': MIMES[ext] || 'application/octet-stream' });
        res.end(content);
      });
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});