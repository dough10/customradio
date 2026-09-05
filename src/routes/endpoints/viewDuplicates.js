const pug = require('pug');

const asyncHandler = require('../../util/asyncHandler.js');
const isAdmin = require('../../util/isAdmin.js');
const {stations} = require('../../services.js');

module.exports = asyncHandler(async ( req, res ) => {
  if (!isAdmin(req)) return res.status(403).send('Forbidden');
  const duplicates = await stations.getDuplicates();
  req.count = duplicates.length;
  res.json(duplicates);
});