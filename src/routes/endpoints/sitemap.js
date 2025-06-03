const fs = require('fs');
const xml2js = require('xml2js');

const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * generates a sitemap.xml file
 * 
 * @param {Object} req 
 * @param {Object} stats 
 * @returns {String}
 */
function sitemapxml(req, stats) {
  const sitemapObject = {
    urlset: {
      $: {
        xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:schemaLocation": "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
      },
      url: {
        loc: `${req.protocol}://${req.get('host')}/`,
        lastmod: stats.mtime.toISOString(),
        priority: '1.0',
        changefreq: 'weekly'
      }
    }
  };
  const builder = new xml2js.Builder();
  return builder.buildObject(sitemapObject);
}

/**
 * sitemap.xml endpoint
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
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