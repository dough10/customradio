const {stations} = require('../../services.js');
const asyncHandler = require("../../util/asyncHandler");
const mapToTxt = require('../../util/mapToTxt.js');
const txtTimeStamp = require('../../util/txtTimeStamp.js');

module.exports = asyncHandler(async (req, res) => {
  const all = await stations.getOnlineStations();
  if (!all || all.length === 0) {
    res.status(404).send('No stations found');
    return;
  }
  res.setHeader('Content-Disposition', 'attachment; filename="radio.txt"');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`${txtTimeStamp(req)}\n${all.map(mapToTxt).join('\n')}`);
});