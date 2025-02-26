const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = (req, res) => {
  const strings = [
    `User-agent: *`,
    'Disallow: /add',
    'Disallow: /csp-report',
    'Disallow: /mark-duplicate',
    'Disallow: /stations',
    'Disallow: /stream-issue',
    'Disallow: /topGenres',
    '',
    `Allow: /$`,
    `Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`
  ];
  log.info(`${req.ip} -> /robots.txt ${Date.now() - req.startTime}ms`);
  res.type('text/plain');
  res.send(strings.join('\n'));
};