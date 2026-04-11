const asyncHandler = require('../../util/asyncHandler.js');

module.exports = asyncHandler((req, res) => {
  res.send('hello world');
});