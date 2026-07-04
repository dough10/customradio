const asyncHandler = require("../../util/asyncHandler");
const { mongo } = require('../../services.js');
const isAdmin = require('../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  const admin = isAdmin(req);
  if (!admin) return res.status(403).json({ message: 'Forbidden' });
  const {hours} = req.params; 
  res.json(await mongo.getRequestCounts(Number(hours)));
});