const fs = require('fs');

const sitemapxml = require('../../util/sitemapxml.js');
const Logger = require('../../util/logger.js');

const log = new Logger('info');

module.exports = (req, res) => {
  fs.stat('index.js', (error, stats) => {
    if (error) {
      log.error('Failed getting sitemap:', error.message);
      res.status(500).json({
        message: 'Failed getting sitemap.xml'
      });
    }
    log.info(`${req.ip} -> ${req.originalUrl} ${Date.now() - req.startTime}ms`);
    const xml = sitemapxml(req, stats);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  });
};