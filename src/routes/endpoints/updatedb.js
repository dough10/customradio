const { testStreams } = require('../../util/testStreams.js');
const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = async (req, res) => {
  try {
    testStreams();
    res.json({
      message: 'update began.'
    });
  } catch(e) {
    log.error(`Error while updating database: ${e.message}`);
    return res.status(500).json({
      error: 'Failed to start update process.'
    });
  }
}