const xml2js = require('xml2js');
const fs = require('fs');

const log = require('../util/log.js');

module.exports = (req, res) => {
  fs.stat('index.js', (error, stats) => {
    if (error) {
      console.error('Failed getting sitemap:', error.message);
      res.status(500).json({
        message: 'Failed getting sitemap.xml'
      });
    }
    log(`${req.ip} -> ${req.originalUrl}`);
    const sitemapObject = {
      urlset: {
        $: {
          xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
          "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
          "xsi:schemaLocation": "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
        },
        url: {
          loc: `${req.protocol}://${req.get('host')}/`,
          lastmod: stats.mtime.toISOString()
        }
      }
    };
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(sitemapObject);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  });
};