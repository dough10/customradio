const log = require('../util/log.js');

module.exports = (req, res) => {
  const strings = [
    `User-agent: *`,
    `Allow: /`,
    `Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`
  ]
  const joinedStrings = strings.join('\n');
  log(`${req.ip} -> /robots.txt`);
  res.type('text/plain');
  res.send(joinedStrings);
};