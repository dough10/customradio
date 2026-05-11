const {validationResult} = require('express-validator');

const {stations} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');
const isAdmin = require('../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('unauthorized');

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    logger.error(message);
    return res.status(400).json({message});
  }
  const {id} = req.body;
  await stations.unmarkDuplicate(id);
  res.send(id);
});