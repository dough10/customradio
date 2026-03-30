const { testStreams } = require('../../util/testStreams.js');
const asyncHandler = require('../../util/asyncHandler.js');
const isAdmin = require('./../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({message:'Forbidden'});
  testStreams();
  res.json({
    message: 'update began.'
  });
});