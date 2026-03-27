const asyncHandler = require('./../../util/asyncHandler.js');
const isAdmin = require('./../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  if(!isAdmin(req)) return res.status(403).json({message:'Forbiden'});
  res.text('woo hoo');
});