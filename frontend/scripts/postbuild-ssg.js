const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

const BUILD_DIR = path.join(__dirname, '../build');

// Canonical Public Routes to Pre-Render (SSG)
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/services',
  '/services/demat',
  '/services/mutual-fund',
  '/services/ipo',
  '/services/slbm',
  '/services/insurance',
  '/services/physical-shares',
  '/services/iepf',
  '/services/trading',
  '/services/pms',
  '/services/aif',
  '/contact',
];

// Content Types Map for local static file server
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

// 1. Minimal Static File Server for post-build snapshot capture
function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(BUILD_DIR, req.url.split('?')[0]);
      if (filePath.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(BUILD_DIR, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading file');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`[SSG Pre-Renderer] Local build server running on port ${port}`);
      resolve({ server, port });
    });
  });
}

// 2. Pre-Rendering Engine (SSG)
async function generateStaticPages() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`[SSG Pre-Renderer] Build directory not found: ${BUILD_DIR}`);
    process.exit(1);
  }

  const { server, port } = await startStaticServer();
  console.log(`[SSG Pre-Renderer] Pre-rendering ${PUBLIC_ROUTES.length} public routes to static HTML...`);

  let browser;
  try {
    const systemChromePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
    ].filter(Boolean);

    let executablePath;
    for (const p of systemChromePaths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }

    const launchOptions = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };
    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchOptions);

    for (const route of PUBLIC_ROUTES) {
      const page = await browser.newPage();
      const targetUrl = `http://127.0.0.1:${port}${route}`;

      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Allow Helmet & React 19 to settle DOM & metadata
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      const html = await page.content();

      // Determine output filepath (e.g., build/about/index.html)
      const targetDir = route === '/' ? BUILD_DIR : path.join(BUILD_DIR, route);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const outputFile = path.join(targetDir, 'index.html');
      fs.writeFileSync(outputFile, html, 'utf8');

      console.log(`  ✓ Pre-rendered: ${route} -> ${path.relative(BUILD_DIR, outputFile)}`);
      await page.close();
    }

    console.log(`[SSG Pre-Renderer] Successfully generated static pre-rendered HTML for all ${PUBLIC_ROUTES.length} public pages!`);
  } catch (error) {
    console.error('[SSG Pre-Renderer] Error during static pre-rendering:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

generateStaticPages();
