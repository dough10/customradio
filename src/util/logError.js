const { getCollection, collections, logger } = require('../services.js');

module.exports = async (error) => {
  try {
    await getCollection(collections.ERRORS).insertOne(error);
  } catch(e) {
    logger.error(e);
  }
}