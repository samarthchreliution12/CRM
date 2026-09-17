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

// Rich Route Metadata Registry for Fallback Pre-Renderer
const ROUTE_METADATA = {
  '/': {
    title: 'Investment & Financial Consulting Experts | Parshwa Consultancy',
    description: 'Parshwa Consultancy provides comprehensive financial advisory including mutual funds, equity investment, Demat, physical share dematerialization, and IEPF recovery in Ahmedabad, Gujarat.',
    canonical: 'https://parshwaconsultancy.in/',
    h1: 'Trusted Partner in Financial Growth & Investment Recovery',
    bodyText: 'Parshwa Consultancy provides specialized financial advisory services including mutual funds, physical share dematerialization, IEPF recovery, IPO placement, Demat accounts, and portfolio management.',
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "FinancialService",
        "name": "Parshwa Consultancy",
        "url": "https://parshwaconsultancy.in/",
        "logo": "https://parshwaconsultancy.in/logo.png",
        "telephone": "+91 98765 43210",
        "email": "info@parshwaconsultancy.com",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Ahmedabad",
          "addressRegion": "Gujarat",
          "addressCountry": "India"
        }
      }
    ]
  },
  '/about': {
    title: 'About Us - 35+ Years in Financial Growth & Recovery | Parshwa Consultancy',
    description: 'Learn about Parshwa Consultancy, our 35+ years legacy in financial advisory, mutual fund management, and specialized physical share & IEPF investment recovery.',
    canonical: 'https://parshwaconsultancy.in/about',
    h1: 'About Parshwa Consultancy',
    bodyText: 'Over 35 years of dedicated experience in investment consulting, mutual funds, physical share dematerialization, and unclaimed investment recovery in Ahmedabad, Gujarat.',
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Parshwa Consultancy",
        "url": "https://parshwaconsultancy.in/about"
      }
    ]
  },
  '/services': {
    title: 'Financial Services Catalog - Investments, Demat & Recovery | Parshwa Consultancy',
    description: 'Comprehensive catalog of financial solutions: Demat, Mutual Funds, IPO, SLBM, Term & Health Insurance, Physical Share Dematerialization, IEPF Recovery, Trading & PMS.',
    canonical: 'https://parshwaconsultancy.in/services',
    h1: 'Financial Services Catalog',
    bodyText: 'Explore our complete services catalog including Demat, Mutual Funds, IPO, SLBM, Insurance Advisory, Physical Shares Dematerialization, IEPF Recovery, Trading, PMS, and AIF.',
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Parshwa Consultancy Financial Services Catalog"
      }
    ]
  },
  '/services/demat': {
    title: 'Demat Services - Expert Financial Solutions | Parshwa Consultancy',
    description: 'A Demat (Dematerialized) account provides a secure, electronic repository to hold equity shares, mutual fund units, government bonds, and Sovereign Gold Bonds under NSDL/CDSL depositories.',
    canonical: 'https://parshwaconsultancy.in/services/demat',
    h1: 'Demat Services',
    bodyText: 'Manage & Safeguard Your Securities Digitally with NSDL/CDSL Depository Participant support.',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "Demat Services" }]
  },
  '/services/mutual-fund': {
    title: 'Mutual Fund Advisory - Expert Financial Solutions | Parshwa Consultancy',
    description: 'Disciplined asset allocation & goal-based wealth growth through research-backed equity, debt, and ELSS mutual fund schemes.',
    canonical: 'https://parshwaconsultancy.in/services/mutual-fund',
    h1: 'Mutual Fund Advisory',
    bodyText: 'Strategic wealth creation through goal-aligned portfolios, SIP execution, and ELSS tax saving.',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "Mutual Fund Advisory" }]
  },
  '/services/ipo': {
    title: 'IPO Services - Expert Financial Solutions | Parshwa Consultancy',
    description: 'Primary market opportunities, quota guidance, and application assistance for mainboard and SME public issues on NSE/BSE.',
    canonical: 'https://parshwaconsultancy.in/services/ipo',
    h1: 'IPO Services',
    bodyText: 'Early access to high-growth public offerings with ASBA & UPI guidance.',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "IPO Services" }]
  },
  '/services/slbm': {
    title: 'SLBM Services - Expert Financial Solutions | Parshwa Consultancy',
    description: 'Securities Lending & Borrowing Mechanism (SLBM) allows long-term stock investors to earn extra yield on idle Demat shares.',
    canonical: 'https://parshwaconsultancy.in/services/slbm',
    h1: 'SLBM Services',
    bodyText: 'Earn yield on idle long-term equity holdings with 100% exchange clearing house settlement guarantee.',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "SLBM Services" }]
  },
  '/services/insurance': {
    title: 'Insurance Advisory - Expert Financial Solutions | Parshwa Consultancy',
    description: 'Comprehensive term life protection and cashless health insurance planning for families and business owners.',
    canonical: 'https://parshwaconsultancy.in/services/insurance',
    h1: 'Insurance Advisory',
    bodyText: 'Protecting family wealth against unforeseen medical and life risks with top IRDAI-regulated insurers.',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "Insurance Advisory" }]
  },
  '/services/physical-shares': {
    title: 'Physical Shares Solutions - Expert Financial Solutions | Parshwa Consultancy',
    description: 'Converting old paper share certificates into electronic Demat holdings, duplicate share issuance, and legacy transmission.',
    canonical: 'https://parshwaconsultancy.in/services/physical-shares',
    h1: 'Physical Shares Solutions',
    bodyText: 'Transforming legacy paper share certificates into electronic Demat assets with RTA coordination.',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "Physical Shares Solutions" }]
  },
  '/services/iepf': {
    title: 'IEPF Services - Expert Financial Solutions | Parshwa Consultancy',
    description: 'Reclaiming transferred shares and unclaimed dividends from the Investor Education and Protection Fund (IEPF) Authority.',
    canonical: 'https://parshwaconsultancy.in/services/iepf',
    h1: 'IEPF Services',
    bodyText: 'Restoring unclaimed family shares and dividends transferred to MCA IEPF Authority under Section 124(6).',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "IEPF Services" }]
  },
  '/services/trading': {
    title: 'Trading Account Services - Expert Financial Solutions | Parshwa Consultancy',
    description: 'Multi-asset exchange execution desk across equity cash, futures & options (F&O), and currency derivatives.',
    canonical: 'https://parshwaconsultancy.in/services/trading',
    h1: 'Trading Account Services',
    bodyText: 'Direct exchange access and intraday trading capabilities on NSE and BSE.',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "Trading Account Services" }]
  },
  '/services/pms': {
    title: 'Portfolio Management Services (PMS) - Expert Financial Solutions | Parshwa Consultancy',
    description: 'Customized equity portfolio management for High Net Worth Individuals with direct stock ownership in Demat accounts.',
    canonical: 'https://parshwaconsultancy.in/services/pms',
    h1: 'Portfolio Management Services (PMS)',
    bodyText: 'High-conviction equity portfolios for HNIs under SEBI regulated PMS framework.',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "Portfolio Management Services" }]
  },
  '/services/aif': {
    title: 'Alternative Investment Funds (AIF) - Expert Financial Solutions | Parshwa Consultancy',
    description: 'Institutional-grade private equity, venture capital, pre-IPO growth equity, and non-correlated asset exposure.',
    canonical: 'https://parshwaconsultancy.in/services/aif',
    h1: 'Alternative Investment Funds (AIF)',
    bodyText: 'Institutional access to private markets, structured debt, and unlisted growth equity under SEBI AIF regulations.',
    schema: [{ "@context": "https://schema.org", "@type": "Service", "name": "Alternative Investment Funds" }]
  },
  '/contact': {
    title: 'Contact Us - Parshwa Consultancy Advisory Team | Parshwa Consultancy',
    description: 'Connect with Parshwa Consultancy in Ahmedabad, Gujarat for financial advisory, mutual funds, physical share demat, and IEPF recovery assistance.',
    canonical: 'https://parshwaconsultancy.in/contact',
    h1: 'Connect With Our Advisory Team',
    bodyText: 'Get in touch with Parshwa Consultancy for mutual funds, portfolio management, physical share dematerialization, or IEPF investment recovery.',
    schema: [{ "@context": "https://schema.org", "@type": "ContactPage", "name": "Contact Parshwa Consultancy" }]
  }
};

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

// Fallback Node HTML Injector for CI/CD environments (Vercel, AWS Lambda, Docker) where Chromium dependencies are absent
function fallbackNodeStaticPreRender() {
  console.log('[SSG Pre-Renderer] Executing Fallback Node Static Metadata & HTML Injector...');
  const templatePath = path.join(BUILD_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`[SSG Pre-Renderer] Template file not found: ${templatePath}`);
    return;
  }

  const baseHtml = fs.readFileSync(templatePath, 'utf8');

  for (const route of PUBLIC_ROUTES) {
    const meta = ROUTE_METADATA[route] || {
      title: 'Parshwa Consultancy | Investment & Financial Consulting Experts',
      description: 'Parshwa Consultancy provides comprehensive financial advisory including mutual funds, equity investment, Demat, and IEPF recovery.',
      canonical: `https://parshwaconsultancy.in${route}`,
      h1: 'Parshwa Consultancy',
      bodyText: 'Trusted Partner in Financial Growth & Investment Recovery',
    };

    let customHtml = baseHtml;

    // Inject title, description, canonical link, and JSON-LD schema into <head>
    const headTags = `
      <title>${meta.title}</title>
      <meta name="description" content="${meta.description}">
      <link rel="canonical" href="${meta.canonical}">
      <meta property="og:title" content="${meta.title}">
      <meta property="og:description" content="${meta.description}">
      <meta property="og:url" content="${meta.canonical}">
      <meta property="og:type" content="website">
      <meta property="og:site_name" content="Parshwa Consultancy">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${meta.title}">
      <meta name="twitter:description" content="${meta.description}">
      ${meta.schema ? `<script type="application/ld+json">${JSON.stringify(meta.schema)}</script>` : ''}
    `;

    customHtml = customHtml.replace('</head>', `${headTags}</head>`);

    // Inject pre-rendered semantic HTML body content into <div id="root">
    const rootBody = `
      <div class="website-root-layout" style="display: flex; flex-direction: column; min-height: 100vh;">
        <header class="website-header"><div class="website-container"><nav class="website-navbar"><a href="/" class="website-logo-link"><strong>Parshwa Consultancy</strong></a></nav></div></header>
        <main class="website-main-content">
          <section class="website-section">
            <div class="website-container">
              <h1>${meta.h1}</h1>
              <p>${meta.bodyText}</p>
            </div>
          </section>
        </main>
        <footer class="website-footer"><div class="website-container"><p>© Parshwa Consultancy. All rights reserved.</p></div></footer>
      </div>
    `;

    customHtml = customHtml.replace('<div id="root"></div>', `<div id="root">${rootBody}</div>`);

    const targetDir = route === '/' ? BUILD_DIR : path.join(BUILD_DIR, route);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const outputFile = path.join(targetDir, 'index.html');
    fs.writeFileSync(outputFile, customHtml, 'utf8');
    console.log(`  ✓ Pre-rendered (Fallback Engine): ${route} -> ${path.relative(BUILD_DIR, outputFile)}`);
  }

  console.log(`[SSG Pre-Renderer] Successfully generated pre-rendered static HTML files for all ${PUBLIC_ROUTES.length} routes!`);
}

async function generateStaticPages() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`[SSG Pre-Renderer] Build directory not found: ${BUILD_DIR}`);
    process.exit(1);
  }

  // If Vercel or CI environment is detected, directly use Node Fallback engine to avoid Chromium shared library crashes
  if (process.env.VERCEL || process.env.CI_SKIP_PUPPETEER) {
    console.log('[SSG Pre-Renderer] Vercel CI environment detected. Using native Node static pre-renderer...');
    fallbackNodeStaticPreRender();
    return;
  }

  let serverInstance;
  let browser;
  try {
    const { server, port } = await startStaticServer();
    serverInstance = server;

    console.log(`[SSG Pre-Renderer] Pre-rendering ${PUBLIC_ROUTES.length} public routes to static HTML via Headless Chromium...`);

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
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 800)));

      const html = await page.content();

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
    console.warn('[SSG Pre-Renderer] Headless Chromium launch failed in current environment:', error.message);
    fallbackNodeStaticPreRender();
  } finally {
    if (browser) await browser.close();
    if (serverInstance) serverInstance.close();
  }
}

generateStaticPages();
