const usedTypes = require("./usedTypes.js");

module.exports = dbStatistics;

function dbStatistics(db) {
  const online = db.countDocuments({
    online:true,
    'content-type': usedTypes
  });
  const offline = db.countDocuments({
    online:false,
    'content-type': usedTypes
  });
  return {
    online,
    offline,
    usableEntrys: online + offline
  }
}