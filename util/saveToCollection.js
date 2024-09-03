require('dotenv').config();

const log = require('./log.js');
const DbConnector = require('./dbConnector.js');

module.exports = async (stats) => {
  const url = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';
  const connector = new DbConnector(url, 'statistics');
  const db = await connector.connect();
  try{
    await db.insertOne(stats);
    log('database statistics saved');
  } catch(error) {
    console.error('Error saving statictics', error.message);
  }
  await connector.disconnect();
};