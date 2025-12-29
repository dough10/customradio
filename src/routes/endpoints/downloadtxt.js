const UserData = require('../../model/UserData.js');
const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

function mapToTxt({name, url}) {
  return `${name.replace(/,/g, '')}, ${url}`;
}

function timestamp(req) {
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const host = (req.hostname || '').replace(/[\r\n]/g, '');
  return `# created by ${req.protocol}://${host} [${formattedDate}]\n# name, url\n`;
}

module.exports = async (req, res) => {
  let sql;
  
  const uid = String(req.params.uid || '').trim();
  if (!uid) {
    res.status(400).send('Bad Request: Missing user ID');
    return;
  }

  try {
    sql = new UserData('data/customradio.db');
  
    const stations = await sql.userStations(`user_${uid}`);
    if (!stations || stations.length === 0) {
      res.status(404).send('No stations found for the specified user ID');
      return;
    }
    res.setHeader('Content-Disposition', 'attachment; filename="radio.txt"');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(`${timestamp(req)}\n${stations.map(mapToTxt).join('\n')}`);
  }
  catch(e) {
    log.error(`/txt/${uid} endpoint: ${e.message}`);
    res.status(500).send('Internal Server Error');
    return;
  }
  finally {
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