const xml2js = require('xml2js');
const fs = require('fs');

const log = require('../util/log.js');

module.exports = (req, res) => {
  fs.stat('index.js', (error, stats) => {
    if (error) {
      console.error(error);
      res.status(500).json({
        message: 'Failed getting sitemap.xml'
      });
    }
    log(`${req.ip} -> /sitemap.xml`);
    const date = stats.mtime.toISOString();
    const sitemapObject = {
      urlset: {
        $: {
          xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
          "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
          "xsi:schemaLocation": "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
        },
        url: {
          loc: "https://customradio.dough10.me/",
          lastmod: date
        }
      }
    };
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(sitemapObject);
    res.send(xml);
  });
};