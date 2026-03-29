const { validationResult } = require('express-validator');

const asyncHandler = require("../../util/asyncHandler");
const {alerts} = require('./../../services.js');
const isAdmin = require('./../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    logger.error(message);
    return res.status(400).json({ message });
  }
  
  await alerts.dismissAlert(req.body);
  res.json({
    message: 'alert dismissed'
  });
});