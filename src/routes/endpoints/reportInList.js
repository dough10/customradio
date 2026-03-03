const {stations} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

const blacklist = process.env.BLACKLIST?.split(',') || [];

module.exports = asyncHandler(async (req, res) => {
  const ip = req.ip;
  const id = req.params.id;
  const state = Number(req.params.state);
  
  if (state && blacklist.includes(ip)) {
    res.json({ message: 'ip in blacklist' });
    return;
  }
  if (state) {
    await stations.addToList(id);
  } else {
    await stations.removeFromList(id);
  }
  res.json({ state });
});