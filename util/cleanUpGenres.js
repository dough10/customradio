const DbConnector = require('./dbConnector.js');
const Logger = require('./logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = async () => {
  try{
    const timestamp = new Date().getTime() - 1296000000;
    const url = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';
    const connector = new DbConnector(url, 'genres');
    const db = await connector.connect();
    const result = await db.deleteMany({ time: { $lt: timestamp } });
    log.info(`${result.deletedCount} genre entry(s) were deleted.`);
    await connector.disconnect();
  } catch(error) {
    log.error(`Error cleaning up genres: ${error.message}`);
  }
};