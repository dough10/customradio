const Logger = require('../../util/logger.js');
const Stations = require('../../model/Stations.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const blacklist = process.env.BLACKLIST?.split(',') || [];

module.exports = async (req, res) => {
  const ip = req.ip;
  const id = req.params.id;
  const state = Number(req.params.state);
  const sql = new Stations('data/customradio.db');

  if (state && blacklist.includes(ip)) {
    res.json({ message: 'ip in blacklist' });
    return;
  }

  try {
    if (state) {
      await sql.addToList(id);
    } else {
      await sql.removeFromList(id);
    }
    res.json({ state });
  } catch(e) {
    const eMessage = `Failed ${state ? 'adding' : 'removing'} from inList: ${e.message}`;
    res.status(500).json({error: eMessage});
    log.error();
  } finally {
    await sql.close();
  }
};