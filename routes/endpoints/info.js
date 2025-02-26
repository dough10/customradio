const fs = require('fs');
const path = require('path');
const Logger = require('../../util/logger.js');

const log = new Logger('info');

module.exports = (req, res) => {
  try {
    const packagePath = path.join(__dirname, '../../package.json');
    const packageData = fs.readFileSync(packagePath, 'utf8');
    
    const packageJson = JSON.parse(packageData);
    log.info(`${req.ip} -> /info ${Date.now() - req.startTime}ms`);
    res.json({dependencies: packageJson.dependencies, version: packageJson.version});
  } catch (err) {
    log.error('Error reading package.json:', err);
    res.status(500).json({ error: 'An error occurred while reading the package.json file' });
  }
};
