const sqlite3 = require('sqlite3').verbose();
const usedTypes = require("../util/usedTypes.js").$in;

/**
 * Class representing a collection of radio stations.
 */
class Stations {
  /**
   * Create a Stations instance.
   * 
   * @param {string} filePath - The file path to the SQLite database.
   * 
   * @throws {Error} If the file path is not provided or the database cannot be created.
   */
  constructor(filePath) {
    if (!filePath) throw new Error('Database file path is required');
    this.db = new sqlite3.Database(filePath, err => {
      if (err) throw new Error('Failed creating database file');

      const createTableQuery = `CREATE TABLE IF NOT EXISTS stations(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        url TEXT,
        genre TEXT,
        online BOOLEAN,
        content_type TEXT,
        bitrate INTEGER,
        icon TEXT,
        homepage TEXT,
        error TEXT,
        duplicate BOOLEAN
      )`;

      this.db.run(createTableQuery, error => {
        if (error) throw new Error(`Failed creating the stations table: ${error.message}`);
      });
    });
  }

  /**
   * Retrieve all stations from the database.
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects.
   * 
   * @throws {Error} If the query fails.
   */
  async getAllStations() {
    const getQuery = 'SELECT * FROM stations';
    return this._runQuery(getQuery);
  }

  /**
   * Retrieve stations from the database by genre.
   * 
   * @param {string} genre - The genre to filter stations by.
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects.
   * 
   * @throws {Error} If the query fails.
   */
  async getStationsByGenre(genre) {
    const contentTypePlaceholders = usedTypes.map(() => '?').join(',');
    
    const genrePatterns = genre.map(g => `%${g.toLowerCase()}%`);
  
    const nameConditions = genrePatterns.map(() => 'LOWER(name) LIKE ?').join(' OR ');
    const genreConditions = genrePatterns.map(() => 'LOWER(genre) LIKE ?').join(' OR ');
  
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage
    FROM stations
    WHERE content_type IN (${contentTypePlaceholders})
      AND online = 1
      AND duplicate = 0
      AND bitrate IS NOT NULL
      AND (${nameConditions} OR ${genreConditions})
    ORDER BY name ASC;`;
    const params = [...usedTypes, ...genrePatterns, ...genrePatterns];

    return this._runQuery(query, params);
  }

  /**
   * Get all online stations with the correct content type.
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects.
   * 
   * @throws {Error} If the query fails.
   */
  async getOnlineStations() {
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage
    FROM stations
    WHERE content_type IN (${usedTypes.map(() => '?').join(',')})
      AND online = 1
      AND duplicate = 0
      AND bitrate IS NOT NULL
    ORDER BY name ASC;`;

    return this._runQuery(query, usedTypes);
  }

  /**
   * Mark a station as a duplicate in the database.
   * 
   * @param {number} id - The ID of the station to mark as a duplicate.
   * 
   * @returns {Promise<void>} A promise that resolves when the station is marked as a duplicate.
   * 
   * @throws {Error} If the query fails.
   */
  markDuplicate(id) {
    const query = `UPDATE stations SET duplicate = 1 WHERE id = ?`;
    return this._runQuery(query, [id]);
  }

  /**
   * Add a new station to the database.
   * 
   * @param {Object} obj - The station object.
   * @param {string} obj.name - The name of the station.
   * @param {string} obj.url - The URL of the station.
   * @param {string} obj.genre - The genre of the station.
   * @param {boolean} obj.online - The online status of the station.
   * @param {string} obj['content-type'] - The content type of the station.
   * @param {number} obj.bitrate - The bitrate of the station.
   * @param {string} obj.icon - The icon URL of the station.
   * @param {string} obj.homepage - The homepage URL of the station.
   * @param {string} obj.error - Any error message related to the station.
   * @param {boolean} obj.duplicate - Whether the station is a duplicate.
   * 
   * @returns {Promise<number|string>} A promise that resolves to the ID of the new station or a message if the station already exists.
   * 
   * @throws {Error} If the station object or URL is not provided.
   */
  async addStation(obj) {
    if (!obj || !obj.url) throw new Error('Station object with a valid URL is required');

    const existQuery = `SELECT * FROM stations WHERE url = ?`;
    const rows = await this._runQuery(existQuery, [obj.url]);

    if (rows.length > 0) {
      return 'Station exists';
    }

    // Type checks for all properties with detailed error messages
    if (typeof obj.name !== 'string') throw new Error('Invalid type for property "name". Expected string.');
    if (typeof obj.url !== 'string') throw new Error('Invalid type for property "url". Expected string.');
    if (typeof obj.genre !== 'string') throw new Error('Invalid type for property "genre". Expected string.');
    if (typeof obj.online !== 'boolean') throw new Error('Invalid type for property "online". Expected boolean.');
    if (typeof obj['content-type'] !== 'string') throw new Error('Invalid type for property "content-type". Expected string.');
    if (typeof obj.bitrate !== 'number') throw new Error('Invalid type for property "bitrate". Expected number.');
    if (typeof obj.icon !== 'string') throw new Error('Invalid type for property "icon". Expected string.');
    if (typeof obj.homepage !== 'string') throw new Error('Invalid type for property "homepage". Expected string.');
    if (typeof obj.error !== 'string') throw new Error('Invalid type for property "error". Expected string.');
    if (typeof obj.duplicate !== 'boolean') throw new Error('Invalid type for property "duplicate". Expected boolean.');

    const addQuery = `INSERT INTO stations (
      name, 
      url, 
      genre, 
      online, 
      content_type, 
      bitrate, 
      icon, 
      homepage, 
      error, 
      duplicate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [obj.name, obj.url, obj.genre, obj.online, obj['content-type'], obj.bitrate, obj.icon, obj.homepage, obj.error, obj.duplicate];

    return new Promise((resolve, reject) => {
      this.db.run(addQuery, values, function (err) {
        if (err) {
          reject(new Error(`Failed to add station: ${err.message}`));
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Update the properties of a station.
   * 
   * @param {Object} obj - The station object.
   * @param {number} obj.id - The ID of the station.
   * @param {string} obj.name - The name of the station.
   * @param {string} obj.url - The URL of the station.
   * @param {string} obj.genre - The genre of the station.
   * @param {boolean} obj.online - The online status of the station.
   * @param {string} obj['content-type'] - The content type of the station.
   * @param {number} obj.bitrate - The bitrate of the station.
   * @param {string} obj.icon - The icon URL of the station.
   * @param {string} obj.homepage - The homepage URL of the station.
   * @param {string} obj.error - Any error message related to the station.
   * @param {boolean} obj.duplicate - Whether the station is a duplicate.
   * 
   * @returns {Promise<string>} A promise that resolves to a success message.
   * 
   * @throws {Error} If the station object, ID, or any required property is not provided.
   */
  async updateStation(obj) {
    if (!obj || typeof obj.id !== 'number' || typeof obj.name !== 'string' || typeof obj.url !== 'string' || typeof obj.genre !== 'string' || typeof obj.online !== 'boolean' || typeof obj['content-type'] !== 'string' || typeof obj.bitrate !== 'number' || typeof obj.icon !== 'string' || typeof obj.homepage !== 'string' || typeof obj.error !== 'string' || typeof obj.duplicate !== 'boolean') {
      throw new Error('Station object with valid id and all properties is required');
    }

    const updateQuery = `UPDATE stations SET 
      name = ?, 
      url = ?, 
      genre = ?, 
      online = ?, 
      content_type = ?, 
      bitrate = ?, 
      icon = ?, 
      homepage = ?, 
      error = ?, 
      duplicate = ?
      WHERE id = ?`;
    const values = [obj.name, obj.url, obj.genre, obj.online, obj['content-type'], obj.bitrate, obj.icon, obj.homepage, obj.error, obj.duplicate, obj.id];

    return new Promise((resolve, reject) => {
      this.db.run(updateQuery, values, function (err) {
        if (err) {
          reject(new Error(`Failed to update station: ${err.message}`));
        } else {
          resolve('Station updated successfully.');
        }
      });
    });
  }

  /**
   * Close the database connection.
   * 
   * @returns {Promise<string>} A promise that resolves to a success message.
   * 
   * @throws {Error} If the database connection cannot be closed.
   */
  async close() {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) {
          reject(new Error(`Failed to close the database: ${err.message}`));
        } else {
          resolve('Database connection closed successfully.');
        }
      });
    });
  }

  /**
   * Run a database query.
   * 
   * @param {string} query - The SQL query to run.
   * @param {Array} [params=[]] - The parameters for the SQL query.
   * 
   * @returns {Promise<Array>} A promise that resolves to the result of the query.
   * 
   * @throws {Error} If the query fails.
   * 
   * @private
   */
  _runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(new Error(`Failed running query: ${err.message}`));
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Stations;