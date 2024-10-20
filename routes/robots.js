const log = require('../util/log.js');

module.exports = (req, res) => {
  const strings = [
    `User-agent: *`,
    'Disallow: /add',
    'Disallow: /csp-report',
    'Disallow: /mark-duplicate',
    'Disallow: /metrics',
    'Disallow: /stations',
    'Disallow: /stream-issue',
    'Disallow: /topGenres',
    '',
    `Allow: /$`,
    `Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`
  ];
  log(`${req.ip} -> /robots.txt`);
  res.type('text/plain');
  res.send(strings.join('\n'));
};