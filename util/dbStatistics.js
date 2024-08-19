const usedTypes = require("./usedTypes.js");

module.exports = dbStatistics;

async function dbStatistics(db) {
  const online = await db.countDocuments({
    online:true,
    'content-type': usedTypes
  });
  const offline = await db.countDocuments({
    online:false,
    'content-type': usedTypes
  });
  return {
    online,
    offline,
    usableEntrys: online + offline
  }
}