const asyncHandler = require('../../util/asyncHandler.js');
const scrape = require('./../../util/scrapeIcecastDirectory.js');
const isAdmin = require('./../../util/isAdmin.js');
const { updater } = require('../../services.js');

module.exports = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({message:'Forbidden'});
  if (updater.running) {
    res.json({
      message: 'Updater is currently running'
    });
    return;
  }
  scrape();
  res.json({
    message: 'scrape has began.'
  });
});