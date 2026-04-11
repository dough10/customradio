const {stations} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

const blacklist = process.env.BLACKLIST?.split(',') || [];

/**
 * Reports a play for a station and increments its play count
 * Rate limited to one request per IP address every 5 minutes
 * 
 * @param {ReportPlayRequest} req Express request object
 * @param {Response} res Express response object
 * 
 * @returns {Promise<void>}
 * 
 * @throws {Error} If play count increment fails
 */
module.exports = asyncHandler(async (req, res) => {
  const ip = req.ip;
  if (blacklist.includes(ip)) {
    res.json({ message: 'ip in blacklist' });
    return;
  }
  
  const id = req.params.id;
  if (!id || isNaN(id)) {
    res.status(400).json({ error: 'Invalid station ID' });
    return;
  }


  await stations.incrementPlayMinutes(id);
  res.status(204).send();
});