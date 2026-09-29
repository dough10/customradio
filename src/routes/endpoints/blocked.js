const asyncHandler = require('../../util/asyncHandler.js');
const { mongo } = require('../../services.js');
const isAdmin = require('./../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: 'You shall not pass' });
  }
  
  res.json(await mongo.getBlockedIPs());
});