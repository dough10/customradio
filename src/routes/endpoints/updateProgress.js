const { updater } = require('../../services.js');

module.exports = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();

  res.write(`: connected\n\n`);
  
  const send = (value) => {
    res.write(`data: ${JSON.stringify(value)}\n\n`);
  };

  updater.on("progress", send);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    updater.off("progress", send);
  });
};