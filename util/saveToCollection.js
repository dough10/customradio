require('dotenv').config();

const DbConnector = require('./dbConnector.js');

module.exports = async (obj, collection) => {
  const url = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';
  const connector = new DbConnector(url, collection);
  try{
    const db = await connector.connect();
    await db.insertOne(obj);
  } catch(error) {
    console.critical('Error saving statictics', error.message);
  } finally {
    await connector.disconnect();
  }
};