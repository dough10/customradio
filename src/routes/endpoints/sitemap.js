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
  const baseURL = `${req.protocol}://${req.get('host')}`;
  const paths = ['/'];

  const urlEntries = paths.map(path => ({
    loc: `${baseURL}${path}`,
    lastmod: stats.mtime.toISOString(),
    priority: path === '/' ? '1.0' : '0.8',
    changefreq: 'weekly'
  }));

  const sitemapObject = {
    urlset: {
      $: {
        xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:schemaLocation": "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
      },
      url: urlEntries
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
  fs.stat('dist/index.js', (error, stats) => {
    if (error) {
      log.error(`Failed getting sitemap: ${error.message}`);
      res.status(500).json({
        message: 'Failed getting sitemap.xml'
      });
      return;
    }
    try {
      const xml = sitemapxml(req, stats);
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch(e) {
      res.status(500).json({error: `Failed gettings XML: ${e.message}`})
    }
  });
};