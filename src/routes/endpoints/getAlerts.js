const {alerts} = require('./../../services.js');
module.exports = async (req, res) => {
  const allAlerts = await alerts.getActiveAlerts();
  req.count = allAlerts.length;
  res.json(allAlerts);
};