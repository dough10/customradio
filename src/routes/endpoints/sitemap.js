const fs = require('fs').promises;
const xml2js = require('xml2js');

const asyncHandler = require('../../util/asyncHandler.js');

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
module.exports = asyncHandler(async (req, res) => {
  const stats = await fs.stat('dist/index.js');

  const xml = sitemapxml(req, stats);

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});