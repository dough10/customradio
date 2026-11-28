const { updater, scraper, uptime, userData } = require('../../services.js');
const isAdmin = require('../../util/isAdmin.js');

const EVENTS = {
  start: 'start',
  batchStart: 'batchStart',
  batchComplete: 'batchComplete',
  progress: 'progress',
  done: 'done',
  stopped: 'stopped'
};

module.exports = (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('You shall not pass');

  const send = (value) => {
    res.write(`data: ${JSON.stringify(value)}\n\n`);
  };

  const sendUptime = _ => send({
    uptime: uptime()
  });

  const sendUpdate = v => send({
    ...v,
    type: 'update'
  });

  const sendScrape = v => send({
    ...v,
    type: 'scrape'
  });

  const sendUserData = userStats => send({
    userStats
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.flushHeaders();

  sendUptime()

  const ut = setInterval(sendUptime, 1000);
  const ud = setInterval(_ => sendUserData(userData.stats()), 3_600_000);
  userData.on('user:change', sendUserData);

  const events = Object.values(EVENTS);


  for (const ev of events) {
    updater.on(ev, sendUpdate);
    scraper.on(ev, sendScrape);
  }

  req.on('close', () => {
    [ut,ud].forEach(clearInterval);
    userData.off('user:change', sendUserData);
    for (const ev of events) {
      updater.off(ev, sendUpdate);
      scraper.off(ev, sendScrape);
    }
  });
};