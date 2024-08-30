const {MongoClient} = require('mongodb');

const log = require('./log.js');

/**
 * A class to handle connections to a MongoDB database.
 */
class DbConnector {
  /**
   * Creates an instance of DbConnector.
   * 
   * @param {string} url - The connection URL for the MongoDB instance.
   * @param {string} collection - The name of the collection to work with.
   */
  constructor(url, collection) {
    /** 
     * @private
     * @type {MongoClient}
     */
    this.client = new MongoClient(url);

    /**
     * The name of the collection in the MongoDB database.
     * 
     * @type {string}
     */
    this.collection = collection;
  }

  /**
   * Connects to the MongoDB database and returns a reference to the specified collection.
   * 
   * @returns {Promise<Collection>} A promise that resolves to the collection reference.
   * 
   * @throws {Error} If there is an error connecting to the database.
   */
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
  
  /**
   * Disconnects from the MongoDB database.
   * 
   * @returns {Promise<void>} A promise that resolves when the disconnection is complete.
   * 
   * @throws {Error} If there is an error closing the connection.
   */
  async disconnect() {
    await this.client.close();
  }
}

module.exports = DbConnector;