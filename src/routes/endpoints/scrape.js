const asyncHandler = require('../../util/asyncHandler.js');
const scrape = require('./../../util/scrapeIcecastDirectory.js');
const isAdmin = require('./../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({message:'Forbidden'});
  scrape();
  res.json({
    message: 'scrape has began.'
  });
});