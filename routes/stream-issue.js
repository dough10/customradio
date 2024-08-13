module.exports = streamIssue;

const {validationResult} = require('express-validator');

const log = require('../util/log.js');

async function streamIssue(db, req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }
  const {url, error} = req.body;
  log(`${req.ip} -> /stream-issue ${url} ${error}`);
  try {
    const result = await db.updateOne(
      {url}, 
      { $set: { error } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Document not found"
      });
    }
    res.json({
      message: "error logged"
    });
  } catch(entryError) {
    res.status(500).json({
      message: `Failed to log error: ${entryError.message}` 
    });
  }
}