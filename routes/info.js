const fs = require('fs');
const path = require('path');
const log = require('../util/log.js');

module.exports = (req, res) => {
  try {
    const packagePath = path.join(__dirname, '../package.json');
    const packageData = fs.readFileSync(packagePath, 'utf8');
    
    const packageJson = JSON.parse(packageData);
    log(`${req.ip} -> /info ${Date.now() - req.startTime}ms`);
    res.json(packageJson.dependencies);
  } catch (err) {
    console.error('Error reading package.json:', err);
    res.status(500).json({ error: 'An error occurred while reading the package.json file' });
  }
};
