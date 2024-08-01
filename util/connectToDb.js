module.exports = connectToDb;


const {MongoClient} = require('mongodb');


const log = require('./log.js');


/**
 * Connect to a MongoDB instance and return the specified collection.
 * 
 * This function establishes a connection to the MongoDB server using the provided URL,
 * selects the database named 'custom-radio', and returns the 'stations' collection.
 * 
 * @function
 * @async
 * 
 * @param {string} url - The connection string URL for the MongoDB instance.
 * 
 * @returns {Promise<Collection>} A promise that resolves to the MongoDB collection object for 'stations'.
 * 
 * @throws {Error} Throws an error if the connection to MongoDB fails.
 * 
 * @example
 * 
 * const url = 'mongodb://localhost:27017';
 * connectToDb(url)
 *   .then(collection => {
 *     // Use the collection object
 *     console.log('Collection is ready to use');
 *   })
 *   .catch(err => {
 *     console.error('Failed to connect to MongoDB:', err);
 *   });
 */
async function connectToDb(url) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    log('Connected to MongoDB');
    const database = client.db('custom-radio');
    return database.collection('stations');
  } catch (err) {
    console.error('(╬ Ò﹏Ó) Error connecting to MongoDB:', err);
    throw err;
  }
}