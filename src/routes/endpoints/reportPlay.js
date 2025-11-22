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
  let sql;
  try {
    sql = new Stations('data/customradio.db');
    await sql.incrementPlayMinutes(id);
    res.status(204).send();
  } catch(e) {
    const eMessage = `Error incrimenting play minutes: ${e.message}`;
    res.status(500).json({error: eMessage});
    log.error(eMessage);
  } finally {
    if (!sql || typeof sql.close !== 'function') {
      return;
    }
    try {
      await sql.close();
    } catch (err) {
      log.error(`Error closing DB: ${err.message}`);
    }
  }
};