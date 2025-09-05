const Logger = require('../../util/logger.js');
const Stations = require('../../model/Stations.js');
const { t } = require('../../util/i18n.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const blacklist = process.env.BLACKLIST?.split(',') || [];

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

  const sql = new Stations('data/customradio.db');
  try {
    await sql.incrementPlayMinutes(id);
    res.status(204).json();
  } catch(e) {
    const eMessage = `Error incrimenting play minutes: ${e.message}`;
    res.status(500).json({error: eMessage});
    log.error(eMessage);
  } finally {
    await sql.close();
  }
}