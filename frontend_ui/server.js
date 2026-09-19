import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const INITIAL_PORT = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

function listen(port) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`\n🚀 Deploy Doctor server is LIVE!`);
    console.log(`   > Local:   http://localhost:${port}/`);
    console.log(`   > Network: http://127.0.0.1:${port}/\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const currentPort = server.address() ? server.address().port : INITIAL_PORT;
    const nextPort = currentPort + 1;
    console.log(`\n⚠️  Port ${currentPort} is currently occupied by another process.`);
    console.log(`   Attempting fallback to port ${nextPort}...`);
    setTimeout(() => listen(nextPort), 300);
  } else {
    console.error('Server error:', err);
  }
});

listen(INITIAL_PORT);
