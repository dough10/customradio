const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = (req, res) => {
  const strings = [
    'Contact: mailto:admin@dough10.me',
    'Expires: 2026-01-01T06:00:00.000Z'
  ];
  log.info(`${req.ip} -> /.well-known/security.txt ${Date.now() - req.startTime}ms`);
  res.type('text/plain');
  res.send(strings.join('\n'));
};