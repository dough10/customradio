const Logger = require('../../util/logger.js');
const Stations = require('../../model/Stations.js');
const createRequestHash = require('../../util/createRequestHash.js');
const { t } = require('../../util/i18n.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const ipHashes = new Set();

const blacklist = process.env.BLACKLIST?.split(',') || [];

const RATE_LIMIT_MINUTES = 5;
const RATE_LIMIT_MS = RATE_LIMIT_MINUTES * 60 * 1000;

/**
 * Reports a play for a station and increments its play count
 * Rate limited to one request per IP address every 5 minutes
 * 
 * @param {ReportPlayRequest} req Express request object
 * @param {Response} res Express response object
 * 
 * @returns {Promise<void>}
 * 
 * @throws {Error} If play count increment fails
 */
module.exports = async (req, res) => {
  const requestHash = createRequestHash(
    req.ip, 
    req.headers['user-agent'] || 'unknown'
  );

  if (ipHashes.has(requestHash)) {
    res.status(403).json({ 
      error: 'spam'
    });
    return;
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  if (forwardedFor && forwardedFor !== req.ip || 
      realIp && realIp !== req.ip) {
    log.warn(`Possible IP spoofing attempt: ${req.ip}`);
    res.status(403).json({ 
      error: 'spoof' 
    });
    return;
  }

  const id = req.params.id;
  const ip = req.ip;

  if (!id || isNaN(id)) {
    res.status(400).json({ error: 'Invalid station ID' });
    return;
  }

  if (blacklist.includes(ip)) {
    res.json({ message: 'ip in blacklist' });
    return;
  }

  ipHashes.add(requestHash);
  setTimeout(() => ipHashes.delete(requestHash), RATE_LIMIT_MS);

  const sql = new Stations('data/customradio.db');
  try {
    await sql.incrementPlays(id);
    log.info(`${req.ip} -> /reportPlay/${id} ${Date.now() - req.startTime}ms`);
    res.json({ message: 'play recorded' });
  } catch(e) {
    const eMessage = `Error incrimenting play count: ${e.message}`;
    res.status(500).json({error: eMessage});
    log.error(eMessage);
  } finally {
    await sql.close();
  }
}