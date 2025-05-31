const fs = require('fs');
const path = require('path');
const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = (req, res) => {
  try {
    const packagePath = path.join(__dirname, '../../package.json');
    const packageData = fs.readFileSync(packagePath, 'utf8');
    
    const packageJson = JSON.parse(packageData);
    log.info(`${req.ip} -> /info ${Date.now() - req.startTime}ms`);
    res.json({dependencies: packageJson.dependencies, version: packageJson.version, changelog: require('../../changelog.json')});
  } catch (err) {
    const error = `An error occurred while reading the package.json file: ${err.message}`;
    log.critical(error);
    res.status(500).json({error});
  }
};
