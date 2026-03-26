const {alerts} = require('./../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

module.exports = asyncHandler(async (req, res) => {
  const allAlerts = await alerts.getActiveAlerts();
  req.count = allAlerts.length;
  res.json(allAlerts);
});