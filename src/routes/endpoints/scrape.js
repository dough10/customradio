const asyncHandler = require('../../util/asyncHandler.js');
const scrape = require('./../../util/scrapeIcecastDirectory.js');

module.exports = asyncHandler(async (req, res) => {
  scrape();
  res.json({
    message: 'scrape has began.'
  });
});