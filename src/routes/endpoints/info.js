const changelog = require('../../../changelog.json');
const pack = require('../../../package.json');
const asyncHandler = require('../../util/asyncHandler.js');

module.exports = asyncHandler(async (req, res) => {
  res.json({
    version: pack.version, 
    changelog: changelog, 
    dependencies: pack.dependencies
  });
});
