const { updater, scraper } = require('../../services.js');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.flushHeaders();

  res.write(`: connected\n\n`);
  
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  const send = (value) => {
    res.write(`data: ${JSON.stringify(value)}\n\n`);
  };

  const us = v => send({...v, type: 'update'});
  const ss = v => send({...v, type: 'scrape'});

  updater.on('progress', us);
  scraper.on('progress', ss);

  req.on('close', () => {
    clearInterval(heartbeat);
    updater.off('progress', us);
    scraper.off('progress', ss);
  });
};