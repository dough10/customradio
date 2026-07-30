const { logger } = require('../../services.js');

const recentLogs = [];

logger.on("line", (line) => {
  recentLogs.push(line);
  if (recentLogs.length > 200) {
    recentLogs.shift();
  }
});

module.exports = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();

  for (const line of recentLogs) {
    res.write(`data: ${JSON.stringify(line)}\n\n`);
  }

  const send = (line) => {
    res.write(`data: ${JSON.stringify(line)}\n\n`);
  };

  logger.on("line", send);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    logger.off("line", send);
  });
};