const sqlite3 = require('sqlite3').verbose();
const usedTypes = require("../util/usedTypes.js");

/**
 * Returns a string of placeholders for SQL queries.
 * 
 * @param {Array} arr 
 * 
 * @returns {String}
 */
function mapPlaceholders(arr) {
  return arr.map(() => '?').join(',');
}

/**
 * Callback function for when the database connection is established.
 * 
 * This function is bound to the `Stations` class instance to ensure
 * that the `this` context refers to the class instance.
 * 
 * @param {Error} err - The error object, if any error occurred during the connection.
 */
function connectionEstablished(err) {
  if (err) throw new Error(`Failed to create database file at ${filePath}: ${err.message}`);

  const queries = [
    {
      query: `CREATE TABLE IF NOT EXISTS stations (
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
        duplicate BOOLEAN,
        plays INTEGER DEFAULT 0,
        inList INTEGER DEFAULT 0
      )`,
      errorMsg: 'Failed to create the stations table'
    },
    {
      query: `CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        genres TEXT,
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      errorMsg: 'Failed to create the genres table'
    },
    {
      query: `CREATE INDEX IF NOT EXISTS idx_stations_url ON stations(url)`,
      errorMsg: 'Failed to create index on stations table (url)'
    },
    {
      query: `CREATE INDEX IF NOT EXISTS idx_stations_id ON stations(id)`,
      errorMsg: 'Failed to create index on stations table (id)'
    },
    {
      query: `CREATE INDEX IF NOT EXISTS idx_genres_genres ON genres(genres)`,
      errorMsg: 'Failed to create index on genres table (genres)'
    },
    {
      query: `CREATE INDEX IF NOT EXISTS idx_genres_time ON genres(time)`,
      errorMsg: 'Failed to create index on genres table (time)'
    }
  ];

  return queries.reduce((promise, { query, errorMsg }) => {
    return promise.then(() => {
      return new Promise((resolve, reject) => {
        this.db.run(query, error => {
          if (error) {
            reject(new Error(`${errorMsg}: ${error.message}`));
          } else {
            resolve();
          }
        });
      });
    });
  }, Promise.resolve());
}

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
    this.db = new sqlite3.Database(filePath);
    this.initializationPromise = connectionEstablished.call(this);
  }

  /**
   * Ensure the database is initialized before running a query.
   * 
   * @param {Function} fn - The function to run after initialization.
   * @returns {Promise} A promise that resolves when the function completes.
   */
  async _ensureInitialized(fn) {
    await this.initializationPromise;
    return fn();
  }

  /**
   * Retrieve all stations.
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects.
   * 
   * @throws {Error} If the query fails.
   */
  getAllStations() {
    const getQuery = 'SELECT * FROM stations';
    return this._ensureInitialized(() => this._runQuery(getQuery));
  }

  /**
   * Retrieve stations by genre.
   * 
   * @param {string} genre - The genre to filter stations by.
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects.
   * 
   * @throws {Error} If the query fails.
   */
  getStationsByGenre(genres) {
    const contentTypePlaceholders = mapPlaceholders(usedTypes);
    
    const genrePatterns = genres.map(g => `%${g.toLowerCase()}%`);
  
    const nameConditions = genrePatterns.map(() => 'LOWER(name) LIKE ?').join(' OR ');
    const genreConditions = genrePatterns.map(() => "LOWER(REPLACE(REPLACE(genre, '&', 'and'), '-', '')) LIKE ?").join(' OR ');
  
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage, plays, inList, (inList + plays) as popularity
    FROM stations
    WHERE content_type IN (${contentTypePlaceholders})
      AND online = 1
      AND duplicate = 0
      AND bitrate IS NOT NULL
      AND (${nameConditions} OR ${genreConditions})
    ORDER BY popularity DESC, name ASC;`;
    const params = [...usedTypes, ...genrePatterns, ...genrePatterns];

    return this._ensureInitialized(() => this._runQuery(query, params));
  }

  /**
   * Get all online stations with the correct content type.
   * Sorted by combined inList and plays values, then alphabetically by name
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects.
   * 
   * @throws {Error} If the query fails.
   */
  getOnlineStations() {
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage, plays, inList,
      (inList + plays) as popularity
      FROM stations
      WHERE content_type IN (${mapPlaceholders(usedTypes)})
        AND online = 1
        AND duplicate = 0
        AND bitrate IS NOT NULL
      ORDER BY popularity DESC, name ASC;`;

    return this._ensureInitialized(() => this._runQuery(query, usedTypes));
  }

  /**
   * Check if a station exists.
   * 
   * @param {String} url 
   * 
   * @returns {Promise<Boolean>} A promise that resolves to true if the station exists, false otherwise.
   */
  async exists(url) {
    const query = `SELECT COUNT(*) AS count FROM stations WHERE url = ?`;
    const rows = await this._ensureInitialized(() => this._runQuery(query, [url]));
    return rows[0].count > 0;
  }

  /**
   * Mark a station as a duplicate.
   * 
   * @param {number} id - The ID of the station to mark as a duplicate.
   * 
   * @returns {Promise<void>} A promise that resolves when the station is marked as a duplicate.
   * 
   * @throws {Error} If the query fails.
   */
  markDuplicate(id) {
    const query = `UPDATE stations SET duplicate = 1 WHERE id = ?`;
    return this._ensureInitialized(() => this._runQuery(query, [id]));
  }

  /**
   * Log an error message for a specific station.
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
    return this._ensureInitialized(() => this._runQuery(query, [error, id]));
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
    const rows = await this._ensureInitialized(() => this._runQuery(existQuery, [obj.url]));

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
      duplicate,
      plays,
      inList
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      obj.name,
      obj.url,
      obj.genre,
      obj.online,
      obj['content-type'],
      obj.bitrate,
      obj.icon,
      obj.homepage,
      obj.error,
      obj.duplicate,
      obj.plays || 0,
      obj.inList || 0
    ];

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
   * @param {number} [obj.plays=0] - The play count of the station.
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
      duplicate = ?,
      plays = ?,
      inList = ?
      WHERE id = ?`;
    const values = [
      obj.name,
      obj.url,
      obj.genre,
      obj.online,
      obj['content-type'],
      obj.bitrate,
      obj.icon,
      obj.homepage,
      obj.error,
      obj.duplicate,
      obj.plays || 0,
      obj.inList || 0,
      obj.id
    ];

    return this._ensureInitialized(() => new Promise((resolve, reject) => {
      this.db.run(updateQuery, values, function (err) {
        if (err) {
          reject(new Error(`Failed to update station: ${err.message}`));
        } else {
          resolve('Station updated successfully.');
        }
      });
    }));
  }

  /**
   * Increment the play count for a station
   * 
   * @param {number} id - The ID of the station
   * 
   * @returns {Promise<void>} A promise that resolves when the play count is incremented
   * 
   * @throws {Error} If the query fails
   */
  incrementPlays(id) {
    const query = `UPDATE stations SET plays = plays + 1 WHERE id = ?`;
    return this._ensureInitialized(() => this._runQuery(query, [id]));
  }

  /**
   * Get the play count for a station
   * 
   * @param {number} id - The ID of the station
   * 
   * @returns {Promise<number>} A promise that resolves to the play count
   * 
   * @throws {Error} If the query fails
   */
  async getPlays(id) {
    const query = `SELECT plays FROM stations WHERE id = ?`;
    const rows = await this._ensureInitialized(() => this._runQuery(query, [id]));
    return rows[0]?.plays || 0;
  }

  /**
   * Get the most played stations
   * 
   * @param {number} limit - Maximum number of stations to return
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects
   * 
   * @throws {Error} If the query fails
   */
  getMostPlayed(limit = 10) {
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage, plays
      FROM stations
      WHERE online = 1 
      AND duplicate = 0 
      AND plays > 0
      ORDER BY plays DESC
      LIMIT ?`;
    return this._ensureInitialized(() => this._runQuery(query, [limit]));
  }

  /**
   * Add station to user's list
   * @param {number} id - The ID of the station
   * @returns {Promise<void>} A promise that resolves when the station is added to list
   * @throws {Error} If the query fails
   */
  addToList(id) {
    const query = `UPDATE stations SET inList = 1 WHERE id = ?`;
    return this._ensureInitialized(() => this._runQuery(query, [id]));
  }

  /**
   * Remove station from user's list
   * @param {number} id - The ID of the station
   * @returns {Promise<void>} A promise that resolves when the station is removed from list
   * @throws {Error} If the query fails
   */
  removeFromList(id) {
    const query = `UPDATE stations SET inList = 0 WHERE id = ?`;
    return this._ensureInitialized(() => this._runQuery(query, [id]));
  }

  /**
   * Get all stations in user's list
   * @returns {Promise<Array>} A promise that resolves to an array of station objects
   * @throws {Error} If the query fails
   */
  getListedStations() {
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage, plays
      FROM stations
      WHERE inList = 1
      AND online = 1
      AND duplicate = 0
      ORDER BY name ASC`;
    return this._ensureInitialized(() => this._runQuery(query));
  }

  /**
   * counts stations the meet the input condition
   * 
   * @param {String} condition
   * 
   * @returns {Number|Error} count or error
   */
  _getCount(condition) {
    const typesPlaceholder = mapPlaceholders(usedTypes);
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT COUNT(*) AS count 
        FROM stations 
        WHERE ${condition} AND content_type IN (${typesPlaceholder})`, 
        usedTypes, (err, row) => {
        if (err) {
          reject(new Error(`Failed counting stations: ${err.message}`));
        } else {
          resolve(row.count);
        }
      });
    });
  }

  /**
   * Gets the number of online and total stations.
   * 
   * @returns {Promise<{online: number, total: number}>}
   */
  async dbStats() {
    try {  
      const online = await this._ensureInitialized(() => this._getCount('online = 1'));
      const total = await this._ensureInitialized(() => this._getCount('1'));
  
      return { online, total };
  
    } catch (err) {
      throw new Error(`Error fetching stats: ${err.message}`);
    }
  }
  

  /**
   * Returns the top 10 searched genres in alphabetical order.
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of the top 10 genres.
   */
  async topGenres() {
    const query = `SELECT genres, COUNT(*) as count
      FROM genres
      WHERE time > datetime('now', '-15 days')
      GROUP BY genres
      ORDER BY count DESC
      LIMIT 10;`;
    const response = await this._ensureInitialized(() => this._runQuery(query));
    return response.map(obj => obj.genres).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Log a genre filter query.
   * 
   * @param {string} genre - The genre to log.
   * @param {Date} [time=new Date()] - The time when the genre was logged. Defaults to the current date and time.
   * 
   * @returns {Promise<number>} A promise that resolves to the ID of the logged genre.
   * 
   * @throws {Error} If the query fails.
   */
  logGenres(genre, time = new Date()) {
    const query = `INSERT INTO genres (genres, time) VALUES (?, ?)`;
    return this._ensureInitialized(() => new Promise((resolve, reject) => {
      this.db.run(query, [genre, time.toISOString()], function (err) {
        if (err) {
          reject(new Error(`Failed to log genre: ${err.message}`));
        } else {
          resolve(this.lastID);
        }
      });
    }));
  }

  /**
   * Close the database connection.
   * 
   * @returns {Promise<string>} A promise that resolves to a success message.
   * 
   * @throws {Error} If the database connection cannot be closed.
   */
  close() {
    return this._ensureInitialized(() => new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) {
          reject(new Error(`Failed to close the database: ${err.message}`));
        } else {
          resolve('Database connection closed successfully.');
        }
      });
    }));
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
 * 
 * @throws {Error} If any property is invalid.
 */
function validateStation(obj) {
  if (typeof obj.name !== 'string') throw new Error('Invalid type for property "name". Expected string.');
  if (!isValidURL(obj.url)) throw new Error('Invalid format for property "url". Expected URL');
  if (typeof obj.genre !== 'string') throw new Error('Invalid type for property "genre". Expected string.');
  if (typeof obj.online !== 'boolean') throw new Error('Invalid type for property "online". Expected boolean.');
  if (typeof obj['content-type'] !== 'string') throw new Error('Invalid type for property "content-type". Expected string.');
  if (typeof obj.bitrate !== 'number' || obj.bitrate < 0) throw new Error('Invalid type for property "bitrate". Expected positive number.');
  if (typeof obj.icon !== 'string') throw new Error('Invalid type for property "icon". Expected string.');
  if (typeof obj.homepage !== 'string') throw new Error('Invalid type for property "homepage". Expected string.');
  if (typeof obj.error !== 'string') throw new Error('Invalid type for property "error". Expected string.');
  if (typeof obj.duplicate !== 'boolean') throw new Error('Invalid type for property "duplicate". Expected boolean.');
  if (obj.inList !== undefined && typeof obj.inList !== 'number') {
    throw new Error('Invalid type for property "inList". Expected number.');
  }
}

/**
 * Check if a URL is valid.
 * 
 * @param {String} url 
 * 
 * @returns {Boolean}
 */
function isValidURL(url) {
  const regex = /^(ftp|http|https):\/\/[^ "]+$/;
  return regex.test(url);
}

module.exports = Stations;