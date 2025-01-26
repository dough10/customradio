const log = require('../../util/log.js');

module.exports = (req, res) => {
  const lines = [
    '# ads.txt will be updated once advertising is implemented.',
    '# Placeholder for future ad network info',
    '# google.com, pub-1234567890, DIRECT',
    '# example-network.com, account-id, RESELLER'
  ];
  
  log(`${req.ip} -> /ads.txt ${Date.now() - req.startTime}ms`);
  res.type('text/plain');
  res.send(lines.join('\n'));
};