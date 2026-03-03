const { testStreams } = require('../../util/testStreams.js');
const asyncHandler = require('../../util/asyncHandler.js');

module.exports = asyncHandler(async (req, res) => {
  testStreams();
  res.json({
    message: 'update began.'
  });
});