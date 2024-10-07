require('dotenv').config();

const DbConnector = require('./dbConnector.js');

module.exports = async () => {
  const url = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';
  const connector = new DbConnector(url, collection);
  const db = await connector.connect();
  try{
    const topGenres = await db.aggregate([
      {
        $group: {
          _id: "$genre",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();
    log(`${req.ip} -> /topGenres`);
    res.json(topGenres.map(obj => obj.genre).sort((a, b) => a.localeCompare(b)));
  } catch(error) {
    console.error('Error saving statictics', error.message);
    res.status(500).json({
      error: `Error saving statictics ${error.message}`
    });
  } finally {
    await connector.disconnect();
  }
};