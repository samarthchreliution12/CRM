const express = require('express');
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const hostname = process.env.SITE_URL || 'https://parshwaconsultancy.in';

    // Canonical, publicly indexable website URLs ONLY
    const publicLinks = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/about', changefreq: 'monthly', priority: 0.8 },
      { url: '/services', changefreq: 'weekly', priority: 0.9 },
      { url: '/services/demat', changefreq: 'monthly', priority: 0.8 },
      { url: '/services/mutual-fund', changefreq: 'monthly', priority: 0.8 },
      { url: '/services/ipo', changefreq: 'weekly', priority: 0.8 },
      { url: '/services/slbm', changefreq: 'monthly', priority: 0.8 },
      { url: '/services/insurance', changefreq: 'monthly', priority: 0.8 },
      { url: '/services/physical-shares', changefreq: 'weekly', priority: 0.8 },
      { url: '/services/iepf', changefreq: 'weekly', priority: 0.8 },
      { url: '/services/trading', changefreq: 'monthly', priority: 0.8 },
      { url: '/services/pms', changefreq: 'monthly', priority: 0.8 },
      { url: '/services/aif', changefreq: 'monthly', priority: 0.8 },
      { url: '/contact', changefreq: 'monthly', priority: 0.7 },
    ];

    const stream = new SitemapStream({ hostname });
    const xmlBuffer = await streamToPromise(Readable.from(publicLinks).pipe(stream));

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(xmlBuffer.toString());
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    res.status(500).end();
  }
});

module.exports = router;
