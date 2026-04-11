const asyncHandler = require('../../util/asyncHandler.js');

module.exports = asyncHandler((req, res) => {
  const id = req.params.postID;
  res.send(id);
});