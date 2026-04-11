const DbCon = require('./DbCon.js');
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

const schema = [
  `CREATE TABLE IF NOT EXISTS stations (
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

  `CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    genres TEXT,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE INDEX IF NOT EXISTS idx_stations_url ON stations(url)`,

  `CREATE INDEX IF NOT EXISTS idx_stations_id ON stations(id)`,

  `CREATE INDEX IF NOT EXISTS idx_genres_genres ON genres(genres)`,

  `CREATE INDEX IF NOT EXISTS idx_genres_time ON genres(time)`,

  `CREATE INDEX IF NOT EXISTS idx_stations_playMinutes ON stations(playMinutes)`,

  `CREATE INDEX IF NOT EXISTS idx_stations_compound ON stations(online, duplicate, content_type)`
];

/**
 * Class representing a SQLite database for radio stations
 * Handles CRUD operations, station filtering, and play tracking
 */
class Stations extends DbCon {

  /**
   * Get database schema definitions
   */
  get schema() {
    return [...super.schema, ...schema];
  }

  /**
   * Retrieve all stations.
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects.
   * 
   * @throws {Error} If the query fails.
   */
  getAllStations() {
    return this.all('SELECT * FROM stations');
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
    return this.all(
      'SELECT * FROM stations ORDER BY id LIMIT ? OFFSET ?',
      [limit, offset]
    );
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
      ORDER BY popularity DESC, name ASC`;

    return this.all(query, usedTypes);
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

    if (!genres.length) {
      const query = `SELECT id, name, url, bitrate, genre, icon, homepage, playMinutes, inList,
        (inList * ${DB_CONFIG.POPULARITY_MULTIPLIER} + playMinutes) as popularity
        FROM stations
        WHERE content_type IN (${contentTypePlaceholders})
          AND online = 1
          AND duplicate = 0
          AND bitrate IS NOT NULL
        ORDER BY popularity DESC, name ASC`;

      return this.all(query, usedTypes);
    }

    const genrePatterns = genres.map(g => `%${g.toLowerCase()}%`);

    const nameConditions = genrePatterns.map(() => 'LOWER(name) LIKE ?').join(' OR ');
    const urlConditions = genrePatterns.map(() => 'LOWER(url) LIKE ?').join(' OR ');
    const genreConditions = genrePatterns.map(() =>
      "LOWER(REPLACE(REPLACE(genre, '&', 'and'), '-', '')) LIKE ?"
    ).join(' OR ');

    const combinedConditions = [nameConditions, urlConditions, genreConditions].join(' OR ');

    const query = `SELECT id, name, url, bitrate, genre, icon, homepage, playMinutes, inList,
        (inList * ${DB_CONFIG.POPULARITY_MULTIPLIER} + playMinutes) as popularity
      FROM stations
      WHERE content_type IN (${contentTypePlaceholders})
        AND online = 1
        AND duplicate = 0
        AND bitrate IS NOT NULL
        AND (${combinedConditions})
      ORDER BY popularity DESC, name ASC`;

    const params = [...usedTypes, ...genrePatterns, ...genrePatterns, ...genrePatterns];

    return this.all(query, params);
  }

  /**
   * Check if a station exists.
   * 
   * @param {String} url 
   * 
   * @returns {Promise<Boolean>} A promise that resolves to true if the station exists, false otherwise.
   */
  async exists(url) {
    const row = await this.get(
      `SELECT COUNT(*) AS count FROM stations WHERE url = ?`,
      [url]
    );
    return row.count > 0;
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

    const exists = await this.exists(obj.url);
    if (exists) return 'Station exists';

    const result = await this.run(
      `INSERT INTO stations (
        name, url, genre, online, content_type, bitrate,
        icon, homepage, error, duplicate, playMinutes, inList
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    return result.lastID;
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

    return this.run(
      `UPDATE stations SET 
        name=?, url=?, genre=?, online=?, content_type=?, bitrate=?,
        icon=?, homepage=?, error=?, duplicate=?, playMinutes=?, inList=?
      WHERE id=?`,
      [
        obj.name,
        obj.url,
        obj.genre,
        obj.online,
        obj['content-type'],
        obj.bitrate || 0,
        obj.icon,
        obj.homepage,
        obj.error,
        obj.duplicate,
        obj.playMinutes || 0,
        obj.inList || 0,
        obj.id
      ]
    );
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
    return this.run(`UPDATE stations SET duplicate = 1 WHERE id = ?`, [id]);
  }

  /**
   * returns a count of all station entries
   * 
   * @returns {Number|Error} count or error
   */
  async getTotalCount() {
    const query = 'SELECT COUNT(*) AS count FROM stations';

    const row = await this.get(query);

    return row.count;
  }

  /**
   * Increment station's play minutes count
   * 
   * @param {number} id - Station ID
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} If query fails
   */
  incrementPlayMinutes(id) {
    return this.run(
      `UPDATE stations SET playMinutes = playMinutes + 1 WHERE id = ?`,
      [id]
    );
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
    const row = await this.get(
      `SELECT playMinutes FROM stations WHERE id = ?`,
      [id]
    );
    return row?.playMinutes || 0;
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
    return this.all(
      `SELECT id, name, url, bitrate, genre, icon, homepage, playMinutes
       FROM stations
       WHERE online = 1 
       AND duplicate = 0 
       AND playMinutes > 0
       ORDER BY playMinutes DESC
       LIMIT ?`,
      [limit]
    );
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
    return this.run(
      `UPDATE stations SET inList = inList + 1 WHERE id = ?`,
      [id]
    );
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
    return this.run(
      `UPDATE stations 
       SET inList = CASE 
         WHEN inList > 0 THEN inList - 1 
         ELSE 0 
       END 
       WHERE id = ?`,
      [id]
    );
  }

  /**
   * Get all stations in user's list
   * 
   * @returns {Promise<Array>} A promise that resolves to an array of station objects
   * 
   * @throws {Error} If the query fails
   */
  getListedStations() {
    return this.all(
      `SELECT id, name, url, bitrate, genre, icon, homepage, playMinutes
       FROM stations
       WHERE inList > 0
       AND online = 1
       AND duplicate = 0
       ORDER BY name ASC`
    );
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
    const online = await this.get(
      `SELECT COUNT(*) as count FROM stations 
       WHERE online = 1 AND content_type IN (${mapPlaceholders(usedTypes)})`,
      usedTypes
    );

    const total = await this.get(`SELECT COUNT(*) as count FROM stations`);

    return {
      online: online.count,
      total: total.count
    };
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
    const rows = await this.all(
      `SELECT genres, COUNT(*) as count
       FROM genres
       WHERE time > datetime('now', '-${DB_CONFIG.RECENT_DAYS} days')
       GROUP BY genres
       ORDER BY count DESC
       LIMIT ${DB_CONFIG.TOP_GENRES_LIMIT}`
    );

    return rows.map(obj => obj.genres).sort((a, b) => a.localeCompare(b));
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
    return this.run(
      `INSERT INTO genres (genres, time) VALUES (?, ?)`,
      [genre, time.toISOString()]
    );
  }

  /**
   * Logs an issue with the stream
   * 
   * @param {Number} id 
   * @param {String} error 
   */
  logStreamError(id, error) {
    console.log(id, error);
  }

  /**
   * Close the database connection.
   * 
   * @returns {Promise<string>} A promise that resolves to a success message.
   * 
   * @throws {Error} If the database connection cannot be closed.
   */
  async close() {
    return this.run('PRAGMA optimize').then(() => this.close());
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
}

function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = Stations;