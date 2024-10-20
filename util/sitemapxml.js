const xml2js = require('xml2js');

module.exports = (req, stats) => {
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
};