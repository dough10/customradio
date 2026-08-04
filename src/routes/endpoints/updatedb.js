const { updater, scraper } = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');
const isAdmin = require('./../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('Forbidden');
  if (scraper.running) {
    res.json({
      message: 'scraper is currently running'
    });
    return;
  }
  updater.run();
  res.json({
    message: 'update began.'
  });
});