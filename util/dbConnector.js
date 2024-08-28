const {MongoClient} = require('mongodb');

const log = require('./log.js');

class DbConnector {
  constructor(url, collection) {
    this.client = new MongoClient(url);
    this.collection = collection;
  }
  async connect() {
    try {
      await this.client.connect();
      log('Connected to MongoDB');
      const database = this.client.db('custom-radio');
      return database.collection(this.collection);
    } catch (err) {
      console.error('(╬ Ò﹏Ó) Error connecting to MongoDB:', err);
      throw err;
    }
  }
  
  async disconnect() {
    await this.client.close();
  }
}

module.exports = DbConnector;