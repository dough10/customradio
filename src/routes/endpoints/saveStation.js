const {stations, userData} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

const blacklist = process.env.BLACKLIST?.split(',') || [];

module.exports = asyncHandler(async (req, res) => {
  const userID = req.user ? req.user.id : null;  
  const stationID = req.params.id;
  
  if (!stationID || isNaN(stationID)) {
    res.status(400).send('Invalid station data');
    return;
  }
  
  const state = req.query.state === '1' ? 1 : 0;
  const blackListed = blacklist.includes(req.ip);
  
  if (state) {
    if (!blackListed) await stations.addToList(stationID);
    if (userID) await userData.addStation(userID, stationID);
  } else {
    if (!blackListed) await stations.removeFromList(stationID);
    if (userID) await userData.removeStation(userID, stationID);
  }
  res.status(204).send();
});