const { updater, scraper } = require('../../services.js');

const EVENTS = {
  start: 'start',
  batchStart: 'batchStart',
  progress: 'progress',
  done: 'done',
  stop: 'stop'
};

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

  const events = Object.values(EVENTS);

  for (const ev of events) {
    updater.on(ev, us);
    scraper.on(ev, ss);
  }

  req.on('close', () => {
    clearInterval(heartbeat);
    for (const ev of events) {
      updater.off(ev, us);
      scraper.off(ev, ss);
    }
  });
};