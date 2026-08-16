const { updater, scraper } = require('../../services.js');
const isAdmin = require('./../../util/isAdmin.js');

module.exports = (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('Forbidden');
  if (updater.stop()|| scraper.stop()) {
    res.json({
      message: 'Database process stop requested', 
      stopping: true
    });
    return;
  }
  res.json({
    message: 'No database process is currently running', 
    stopping: false
  });
};