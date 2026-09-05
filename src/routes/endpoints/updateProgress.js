const { updater, scraper, uptime } = require('../../services.js');
const isAdmin = require('../../util/isAdmin.js');

const EVENTS = {
  start: 'start',
  batchStart: 'batchStart',
  progress: 'progress',
  done: 'done',
  stop: 'stop'
};

module.exports = (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('You shall not pass');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.flushHeaders();

  res.write(`data: ${JSON.stringify({
    uptime: uptime()
  })}\n\n`);
  
  const ut = setInterval(_ => res.write(`data: ${JSON.stringify({
    uptime: uptime()
  })}\n\n`), 10000);

  const send = (value) => {
    res.write(`data: ${JSON.stringify(value)}\n\n`);
  };

  const sendUpdate = v => send({
    ...v, 
    type: 'update'
  });
  
  const sendScrape = v => send({
    ...v, 
    type: 'scrape'
  });

  const events = Object.values(EVENTS);

  for (const ev of events) {
    updater.on(ev, sendUpdate);
    scraper.on(ev, sendScrape);
  }

  req.on('close', () => {
    clearInterval(ut);
    for (const ev of events) {
      updater.off(ev, sendUpdate);
      scraper.off(ev, sendScrape);
    }
  });
};