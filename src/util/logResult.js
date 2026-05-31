const { getCollection, collections, logger } = require('../services.js');

module.exports = async (updatedCount, start, end) => {
  try {
    await getCollection(collections.DB_UPDATES).insertOne({
      changed: updatedCount,
      start,
      end,
      type: 'update',
      version: require('../../package.json').version
    });
  } catch (e) {
    logger.error(`Failed to save update details: ${e}`);
  }
}