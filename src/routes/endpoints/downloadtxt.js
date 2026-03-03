const {userData, logger} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

function toTxt({name, url}) {
  return `${name.replace(/,/g, '')}, ${url}`;
}

function timestamp(req) {
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const host = (req.hostname || '').replace(/[\r\n]/g, '');
  return `# created by ${req.protocol}://${host} [${formattedDate}]\n`;
}

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
  res.send(`${timestamp(req)}\n${stations.map(toTxt).join('\n')}`);
});