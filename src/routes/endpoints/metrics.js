const asyncHandler = require('../../util/asyncHandler.js');

module.exports = asyncHandler(async (req, res, register) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});