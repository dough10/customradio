const { validationResult } = require('express-validator');

const {alerts, logger} = require('./../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');
const isAdmin = require('./../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    logger.error(message);
    return res.status(400).json({ message });
  }

  const { id, title, paragraphs, expiresAt } = req.body;

  const alert = await alerts.createAlert({
    id,
    title,
    paragraphs,
    expiresAt
  });

  return res.status(201).json({
    message: 'Alert created successfully',
    alert
  });
});