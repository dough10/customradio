const fs = require('fs');

const log = require('../../util/log.js');
const sitemapxml = require('../../util/sitemapxml.js');

module.exports = (req, res) => {
  fs.stat('index.js', (error, stats) => {
    if (error) {
      console.error('Failed getting sitemap:', error.message);
      res.status(500).json({
        message: 'Failed getting sitemap.xml'
      });
    }
    log(`${req.ip} -> ${req.originalUrl} ${Date.now() - req.startTime}ms`);
    const xml = sitemapxml(req, stats);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  });
};