const fs = require('fs');
const path = require('path');
const http = require('http');

const BUILD_DIR = path.join(__dirname, '../build');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

if (!fs.existsSync(BUILD_DIR)) {
  console.error(`\nError: Build directory not found at ${BUILD_DIR}`);
  console.error(`Please run 'npm run build' first before starting the production server.\n`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end('Method Not Allowed');
  }

  const urlPath = req.url.split('?')[0];
  const cleanPath = urlPath.replace(/\/$/, '');

  // Handle static assets (.js, .css, images, fonts)
  const ext = path.extname(cleanPath);
  if (ext && ext !== '.html') {
    const assetPath = path.join(BUILD_DIR, urlPath);
    if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      return fs.createReadStream(assetPath).pipe(res);
    }
  }

  // Handle HTML routes -> mapped to build/[route]/index.html
  let htmlFile = cleanPath === '' 
    ? path.join(BUILD_DIR, 'index.html') 
    : path.join(BUILD_DIR, cleanPath, 'index.html');

  if (!fs.existsSync(htmlFile)) {
    htmlFile = path.join(BUILD_DIR, 'index.html');
  }

  fs.readFile(htmlFile, 'utf8', (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` Parshwa Consultancy - SSG Production Local Server`);
  console.log(`==================================================`);
  console.log(` Production URL       : http://localhost:${PORT}/`);
  console.log(` View Source URL      : view-source:http://localhost:${PORT}/`);
  console.log(`\n Pre-Rendered Routes to Test:`);
  console.log(` - http://localhost:${PORT}/`);
  console.log(` - http://localhost:${PORT}/about`);
  console.log(` - http://localhost:${PORT}/services`);
  console.log(` - http://localhost:${PORT}/services/demat`);
  console.log(` - http://localhost:${PORT}/services/mutual-fund`);
  console.log(` - http://localhost:${PORT}/contact`);
  console.log(`==================================================\n`);
});
