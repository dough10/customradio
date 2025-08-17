const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * robots.txt endpoint
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
module.exports = (req, res) => {
  const strings = [
    `User-agent: *`,
    'Disallow: /add',
    'Disallow: /csp-report',
    'Disallow: /mark-duplicate',
    'Disallow: /stations',
    'Disallow: /stream-issue',
    'Disallow: /topGenres',
    'Disallow: /reportPlay',
    'Disallow: /reportInList',
    'Disallow: /userStations',
    '',
    `Allow: /$`,
    `Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`
  ];
  res.type('text/plain');
  res.send(strings.join('\n'));
};