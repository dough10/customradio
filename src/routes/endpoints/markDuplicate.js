const {validationResult} = require('express-validator');

const { t } = require('../../util/i18n.js');
const {stations, logger} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

/**
 * endpoint for marking a station as a duplicate
 * 
 * @function
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * 
 * @param {express.Request} req.body - The body of the request.
 * @param {string} req.body.id - The id of the station. Must be a valid id.
 * 
 * @returns {Promise<void>} - A promise that resolves when the response has been sent.
 * 
 * @throws {express.Response} 400 - If validation fails or required fields are missing.
 * @throws {express.Response} 500 - If an error occurs while adding the station to the database.
 */
module.exports = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    logger.error(message);
    return res.status(400).json({message});
  }
  const {id} = req.body;

  await stations.markDuplicate(id);
  res.json({
    message: t('dupLogged')
  });
});