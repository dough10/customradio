const log = require('../util/log.js');

module.exports = (req, res) => {
  log(`${req.ip} -> /robots.txt`);
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /');
}