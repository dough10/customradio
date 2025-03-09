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
      if (err) throw new Error(`Failed to create database file at ${filePath}: ${err.message}`);

      const createStationsTableQuery = `CREATE TABLE IF NOT EXISTS stations(
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

      this.db.run(createStationsTableQuery, error => {
        if (error) throw new Error(`Failed to create the stations table: ${error.message}`);
      });

      const createGenresTableQuery = `CREATE TABLE IF NOT EXISTS genres(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        genres TEXT,
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

      this.db.run(createGenresTableQuery, error => {
        if (error) throw new Error(`Failed to create the genres table: ${error.message}`);
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
  getAllStations() {
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
  getStationsByGenre(genres) {
    const contentTypePlaceholders = usedTypes.map(() => '?').join(',');
    
    const genrePatterns = genres.map(g => `%${g.toLowerCase()}%`);
  
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
  getOnlineStations() {
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
   * check if a station exists in the database.
   * 
   * @param {String} url 
   * 
   * @returns {Promise<Boolean>} A promise that resolves to true if the station exists, false otherwise.
   */
  exists(url) {
    const query = `SELECT COUNT(*) AS count FROM stations WHERE url = ?`;
    return this._runQuery(query, [url]).then(rows => rows[0].count > 0);
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
   * Log an error message for a specific station in the database.
   * 
   * @param {number} id - The ID of the station to log the error for.
   * @param {string} error - The error message to log.
   * 
   * @returns {Promise<void>} A promise that resolves when the error is logged.
   * 
   * @throws {Error} If the query fails.
   */
  logStreamError(id, error) {
    const query = `UPDATE stations SET error = ? WHERE id = ?`;
    return this._runQuery(query, [error, id]);
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
    validateStation(obj);

    const existQuery = `SELECT * FROM stations WHERE url = ?`;
    const rows = await this._runQuery(existQuery, [obj.url]);

    if (rows.length > 0) {
      return 'Station exists';
    }

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
  updateStation(obj) {
    validateStation(obj);

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
   * gets the number of online and total stations in the database.
   * 
   * @returns {Promise<{online: number, total: number}>}
   */
  dbStats() {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT COUNT(*) 
          AS count 
          FROM stations 
          WHERE online = 1
          and content_type IN (${usedTypes.map(() => '?').join(',')})`, usedTypes, (err, row) => {
        if (err) {
          reject(new Error(`Failed to get database statistics: ${err.message}`));
        } else {
          const online = row.count;
          this.db.get(`SELECT COUNT(*) AS count FROM stations WHERE content_type IN (${usedTypes.map(() => '?').join(',')})`, usedTypes, (err, row) => {
            if (err) {
              reject(new Error(`Failed to get database statistics: ${err.message}`));
            } else {
              const total = row.count;
              resolve({ online, total });
            }
          });
        }
      });
    });
  }

  /**
   * gets the top 10 searched genres from the database.
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of the top 10 genres.
   */
  async topGenres() {
    const query = `SELECT genres, COUNT(*) AS count FROM genres GROUP BY genres ORDER BY count DESC LIMIT 10`;
    const response = await this._runQuery(query);
    return response.map(obj => obj.genres).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Log a genre query in the database.
   * 
   * @param {string} genre - The genre to log.
   * 
   * @returns {Promise<number>} A promise that resolves to the ID of the logged genre.
   * 
   * @throws {Error} If the query fails.
   */
  logGenres(genre) {
    const query = `INSERT INTO genres (genres) VALUES (?)`;
    return new Promise((resolve, reject) => {
      this.db.run(query, [genre], function (err) {
        if (err) {
          reject(new Error(`Failed to log genre: ${err.message}`));
        } else {
          resolve(this.lastID);
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
  close() {
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

/**
 * Validate station object properties.
 * 
 * @param {Object} obj - The station object.
 * @throws {Error} If any property is invalid.
 */
function validateStation(obj) {
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
}

module.exports = Stations;