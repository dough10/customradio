const {MongoClient} = require('mongodb');
require('dotenv').config();

const log = require('./log.js');

module.exports = async (stats) => {
  const client = new MongoClient(process.env.DB_HOST || 'mongodb://127.0.0.1:27017');
  try {
    await client.connect();
    const database = client.db('custom-radio');
    const collection = database.collection('statistics');
    await collection.insertOne(stats);
    log('database statistics saved');
    await client.close();
  } catch (err) {
    console.error('(╬ Ò﹏Ó) Error saving db statistics:', err);
    throw err;
  }
};