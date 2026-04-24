const {userData} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');
const mapToTxt = require('../../util/mapToTxt.js');
const txtTimeStamp = require('../../util/txtTimeStamp.js');

module.exports = asyncHandler(async (req, res) => {
  const uid = String(req.params.uid || '').trim();
  if (!uid) {
    res.status(400).send('Bad Request: Missing user ID');
    return;
  }

  const stations = await userData.userStations(`user_${uid}`);
  if (!stations || stations.length === 0) {
    res.status(404).send('No stations found for the specified user ID');
    return;
  }
  res.setHeader('Content-Disposition', 'attachment; filename="radio.txt"');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`${txtTimeStamp(req)}\n${stations.map(mapToTxt).join('\n')}`);
});