const {userData} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

/**
 * Fetches user-specific audio stations from the database.
 * 
 * @async
 * @function
 * @param {Object} req - The HTTP request object containing user information.
 * @param {Object} res - The HTTP response object used to send the results or error messages.
 * 
 * @returns {Promise<void>} A promise that resolves when the response has been sent.
 */
module.exports = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    req.count = 0;
    res.send([]);
    return;
  }
  
  const userID = req.user.id;
  const stations = await userData.userStations(userID);
  
  if (!stations || stations.length === 0) {
    res.send([]);
    return;
  }
  
  req.count = stations.length;
  res.json(stations);
});