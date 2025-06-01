const sqlite3 = require('sqlite3').verbose();
const usedTypes = require("../util/usedTypes.js");

const DB_CONFIG = {
  RECENT_DAYS: 15,
  TOP_GENRES_LIMIT: 10,
  POPULARITY_MULTIPLIER: 30
};

/**
 * Returns a string of comma-separated question marks for SQL placeholders
 * 
 * @param {Array} arr - Array to generate placeholders for
 * 
 * @returns {String} Comma-separated question marks (e.g., "?,?,?")
 * 
 * @example
 * mapPlaceholders([1,2,3]) // returns "?,?,?"
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
        playMinutes INTEGER DEFAULT 0,
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
    },
    {
      query: `CREATE INDEX IF NOT EXISTS idx_stations_playMinutes ON stations(playMinutes)`,
      errorMsg: 'Failed to create index on stations table (playMinutes)'
    },
    {
      query: `CREATE INDEX IF NOT EXISTS idx_stations_compound ON stations(online, duplicate, content_type)`,
      errorMsg: 'Failed to create compound index on stations table'
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
 * Class representing a SQLite database for radio stations
 * Handles CRUD operations, station filtering, and play tracking
 */
class Stations {
  /**
   * Create a Stations instance
   * 
   * @param {string} filePath - Path to SQLite database file
   * @throws {Error} If filePath is not provided
   * @throws {Error} If database connection fails
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
   * 
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
   * get paginated results
   * 
   * @param {Number} limit 
   * @param {Number} offset
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects.
   * 
   * @throws {Error} If the query fails.
   */
  getPaginatedStations(limit, offset) {
    const query = 'SELECT * FROM stations ORDER BY iD LIMIT ? OFFSET ?';
    return this._ensureInitialized(() => this._runQuery(query, [limit, offset]));
  }

  /**
   * Get all online stations with the correct content type
   * Sorted by popularity (inList * DB_CONFIG.POPULARITY_MULTIPLIER + playMinutes) and name
   * 
   * @returns {Promise<Array<{
   *   id: number,
   *   name: string,
   *   url: string,
   *   bitrate: number,
   *   genre: string,
   *   icon: string,
   *   homepage: string,
   *   playMinutes: number,
   *   inList: number,
   *   popularity: number
   * }>>} Array of station objects
   * 
   * @throws {Error} If query fails
   */
  getOnlineStations() {
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage, playMinutes, inList,
      (inList * ${DB_CONFIG.POPULARITY_MULTIPLIER} + playMinutes) as popularity
      FROM stations
      WHERE content_type IN (${mapPlaceholders(usedTypes)})
        AND online = 1
        AND duplicate = 0
        AND bitrate IS NOT NULL
      ORDER BY popularity DESC, name ASC;`;

    return this._ensureInitialized(() => this._runQuery(query, usedTypes));
  }

  /**
   * Get stations matching specified genres
   * Filters by name and genre, sorts by popularity
   * 
   * @param {string[]} genres - Array of genre terms to search for
   * 
   * @returns {Promise<Array<{
   *   id: number,
   *   name: string,
   *   url: string,
   *   bitrate: number,
   *   genre: string,
   *   icon: string,
   *   homepage: string,
   *   playMinutes: number,
   *   inList: number,
   *   popularity: number
   * }>>} Array of matching station objects
   * 
   * @throws {Error} If query fails
   */
  getStationsByGenre(genres) {
    const contentTypePlaceholders = mapPlaceholders(usedTypes);
    
    const genrePatterns = genres.map(g => `%${g.toLowerCase()}%`);
  
    const nameConditions = genrePatterns.map(() => 'LOWER(name) LIKE ?').join(' OR ');
    const genreConditions = genrePatterns.map(() => "LOWER(REPLACE(REPLACE(genre, '&', 'and'), '-', '')) LIKE ?").join(' OR ');
  
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage, playMinutes, inList, (inList * ${DB_CONFIG.POPULARITY_MULTIPLIER} + playMinutes) as popularity
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
   * Add new station to database
   * 
   * @param {Object} obj - Station object
   * @param {string} obj.name - Station name
   * @param {string} obj.url - Station stream URL
   * @param {string} obj.genre - Station genre(s)
   * @param {boolean} obj.online - Online status
   * @param {string} obj['content-type'] - Audio content type
   * @param {number} obj.bitrate - Stream bitrate
   * @param {string} obj.icon - Station icon URL
   * @param {string} obj.homepage - Station website URL
   * @param {string} obj.error - Error message if any
   * @param {boolean} obj.duplicate - Duplicate status
   * @param {number} [obj.playMinutes=0] - Total minutes played
   * @param {number} [obj.inList=0] - Whether station is in user's list (0 or 1)
   * 
   * @returns {Promise<number|string>} New station ID or "Station exists" message
   * 
   * @throws {Error} If validation fails or query errors
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
      playMinutes,
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
      obj.playMinutes || 0,
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
   * Update existing station
   * 
   * @param {Object} obj - Station object with updated values
   * @param {number} obj.id - Station ID to update
   * @param {string} obj.name - Station name
   * @param {string} obj.url - Station stream URL
   * @param {string} obj.genre - Station genre(s)
   * @param {boolean} obj.online - Online status
   * @param {string} obj['content-type'] - Audio content type
   * @param {number} obj.bitrate - Stream bitrate
   * @param {string} obj.icon - Station icon URL
   * @param {string} obj.homepage - Station website URL
   * @param {string} obj.error - Error message if any
   * @param {boolean} obj.duplicate - Duplicate status
   * @param {number} [obj.playMinutes=0] - Total minutes played
   * @param {number} [obj.inList=0] - Whether station is in user's list (0 or 1)
   * 
   * @returns {Promise<string>} Success message
   * 
   * @throws {Error} If validation fails or query errors
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
      playMinutes = ?,
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
      obj.playMinutes || 0,
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
   * Increment station's play minutes count
   * 
   * @param {number} id - Station ID
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} If query fails
   * 
   * @example
   * await stations.incrementPlayMinutes(123);
   */
  incrementPlayMinutes(id) {
    const query = `UPDATE stations SET playMinutes = playMinutes + 1 WHERE id = ?`;
    return this._ensureInitialized(() => this._runQuery(query, [id]));
  }

  /**
   * Get the play minutes for a station
   * 
   * @param {number} id - The ID of the station
   * 
   * @returns {Promise<number>} A promise that resolves to the play count
   * 
   * @throws {Error} If the query fails
   */
  async getPlayMinutes(id) {
    const query = `SELECT playMinutes FROM stations WHERE id = ?`;
    const rows = await this._ensureInitialized(() => this._runQuery(query, [id]));
    return rows[0]?.playMinutes || 0;
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
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage, playMinutes
      FROM stations
      WHERE online = 1 
      AND duplicate = 0 
      AND playMinutes > 0
      ORDER BY playMinutes DESC
      LIMIT ?`;
    return this._ensureInitialized(() => this._runQuery(query, [limit]));
  }

  /**
   * Add station to user's list
   * 
   * @param {number} id - The ID of the station
   * 
   * @returns {Promise<void>} A promise that resolves when the station is added to list
   * 
   * @throws {Error} If the query fails
   */
  addToList(id) {
    const query = `UPDATE stations SET inList = inList + 1 WHERE id = ?`;
    return this._ensureInitialized(() => this._runQuery(query, [id]));
  }

  /**
   * Remove station from user's list
   * Prevents inList from going below 0
   * 
   * @param {number} id - The ID of the station
   * 
   * @returns {Promise<void>} A promise that resolves when the station is removed from list
   * 
   * @throws {Error} If the query fails
   */
  removeFromList(id) {
    const query = `UPDATE stations 
      SET inList = CASE 
        WHEN inList > 0 THEN inList - 1 
        ELSE 0 
      END 
      WHERE id = ?`;
    return this._ensureInitialized(() => this._runQuery(query, [id]));
  }

  /**
   * Get all stations in user's list
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects
   * 
   * @throws {Error} If the query fails
   */
  getListedStations() {
    const query = `SELECT id, name, url, bitrate, genre, icon, homepage, playMinutes
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
   * @param {string[]} [types=usedTypes] optional array of content types
   * 
   * @returns {Number|Error} count or error
   */
  _getUsableCount(condition, types = usedTypes) {
    const typesPlaceholder = mapPlaceholders(types);
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT COUNT(*) AS count 
        FROM stations 
        WHERE ${condition} AND content_type IN (${typesPlaceholder})`, 
        types, (err, row) => {
        if (err) {
          reject(new Error(`Failed counting stations: ${err.message}`));
        } else {
          resolve(row.count);
        }
      });
    });
  }

  /**
   * returns a count of all station entries
   * 
   * @returns {Number|Error} count or error
   */
  getTotalCount() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) AS count FROM stations';
      this.db.get(query, (err, row) => {
        if (err) {
          reject(new Error(`Failed counting stations: ${err.message}`));
        } else {
          resolve(row.count);
        }
      });
    });  
  }

  /**
   * Get database statistics
   * Counts online and total stations with valid content types
   * 
   * @returns {Promise<{
   *   online: number, 
   *   total: number
   * }>} Object containing counts
   * 
   * @throws {Error} If queries fail
   */
  async dbStats() {
    try {  
      const online = await this._ensureInitialized(() => this._getUsableCount('online = 1'));
      const total = await this._ensureInitialized(() => this.getTotalCount());
  
      return { online, total };
  
    } catch (err) {
      throw new Error(`Error fetching stats: ${err.message}`);
    }
  }
  

  /**
   * Get most popular genres from recent searches
   * Returns top 10 genres searched in last 15 days
   * 
   * @returns {Promise<string[]>} Array of genre names
   * 
   * @throws {Error} If query fails
   */
  async topGenres() {
    const query = `SELECT genres, COUNT(*) as count
      FROM genres
      WHERE time > datetime('now', '-${DB_CONFIG.RECENT_DAYS} days')
      GROUP BY genres
      ORDER BY count DESC
      LIMIT ${DB_CONFIG.TOP_GENRES_LIMIT};`;
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
   * Destroy the database instance and clean up resources.
   * 
   * @returns {Promise<void>} A promise that resolves when the instance is destroyed.
   * 
   * @throws {Error} If an error occurs during cleanup.
   */
  async destroy() {
    try {
      await this.close();
      this.db = null;
      this.initializationPromise = null;
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
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