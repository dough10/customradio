const Logger = require('../../util/logger.js');
const Stations = require('../../model/Stations.js');
const { t } = require('../../util/i18n.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = async (req, res) => {
  const id = req.params.id;
  const state = req.params.state;
  const sql = new Stations('data/customradio.db');
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