const log = require('../../util/log.js');

module.exports = (req, res) => {
  const strings = [
    'Contact: mailto:doughten.jimi@gmail.com',
    'Expires: 2026-01-01T06:00:00.000Z'
  ];
  log(`${req.ip} -> /.well-known/security.txt ${Date.now() - req.startTime}ms`);
  res.type('text/plain');
  res.send(strings.join('\n'));
};