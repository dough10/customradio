const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    const packagePath = path.join(__dirname, '../package.json');
    const packageData = fs.readFileSync(packagePath, 'utf8');
    
    const packageJson = JSON.parse(packageData);
    res.json(packageJson.dependencies);

  } catch (err) {
    console.error('Error reading package.json:', err);
    res.status(500).json({ error: 'An error occurred while reading the package.json file' });
  }
};
