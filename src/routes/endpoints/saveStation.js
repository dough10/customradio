const {stations, userData} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

const blacklist = process.env.BLACKLIST?.split(',') || [];

module.exports = asyncHandler(async (req, res) => {
  const state = req.query.state === '1' ? 1 : 0;
  
  const userID = req.user ? req.user.id : null;
  const stationID = req.params.id;

  if (!userID) {
    res.status(204).send();
    return;
  }

  if (!stationID || isNaN(stationID)) {
    res.status(400).send('Invalid station data');
    return;
  }
  if (state) {
    if (!blacklist.includes(req.ip)) await stations.addToList(stationID);
    await userData.addStation(userID, stationID);
  } else {
    await stations.removeFromList(stationID);
    await userData.removeStation(userID, stationID);
  }
  res.status(204).send();
});