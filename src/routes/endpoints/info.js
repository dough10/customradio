const Logger = require('../../util/logger.js');
const changelog = require('../../../changelog.json');
const pack = require('../../../package.json');
const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = (req, res) => {
  try {
    log.info(`${req.ip} -> /info ${Date.now() - req.startTime}ms`);
    res.json({dependencies: pack.dependencies, version: pack.version, changelog: changelog});
  } catch (err) {
    const error = `An error occurred while reading the package.json file: ${err.message}`;
    log.critical(error);
    res.status(500).json({error});
  }
};
