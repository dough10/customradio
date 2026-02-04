const sqlite3 = require('sqlite3').verbose();
const Logger = require('../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = class UserData {
  #db;

  constructor(filePath) {
    if (!filePath) throw new Error('Database file path is required');

    const createTableQuery = `CREATE TABLE IF NOT EXISTS user_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL,
      station_id INTEGER NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user, station_id)
    );`;

    this.#db = new sqlite3.Database(filePath, (err) => {
      if (err) {
        log.error(`Failed to open database: ${err.message}`);
        throw err;
      }
      this.#db.run(createTableQuery, (err) => {
        if (err) {
          log.error(`Error creating user_stations table: ${err.message}`);
          throw err;
        }
      });
    });
  }

  /**
   * Get all stations for a user (with full station details)
   * @param {string} user
   * @returns {Promise<Array>}
   */
  userStations(user) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.id, s.name, s.url, s.bitrate, s.genre, s.homepage, s.icon
        FROM user_stations us
        JOIN stations s ON us.station_id = s.id
        WHERE us.user = ? AND s.online = 1 
        ORDER BY s.name COLLATE NOCASE ASC
      `;
      this.#db.all(query, [user], (err, rows) => {
        if (err) {
          log.error(`Error fetching user stations: ${err.message}`);
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  /**
   * Add a station to a user's list
   * @param {string} user
   * @param {number} stationId
   * @returns {Promise<void>}
   */
  addStation(user, stationId) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR IGNORE INTO user_stations (user, station_id)
        VALUES (?, ?)
      `;
      this.#db.run(query, [user, stationId], function(err) {
        if (err) {
          log.error(`Error adding station ${stationId} for user ${user}: ${err.message}`);
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Remove a station from a user's list
   * @param {string} user
   * @param {number} stationId
   * @returns {Promise<void>}
   */
  removeStation(user, stationId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM user_stations WHERE user = ? AND station_id = ?';
      this.#db.run(query, [user, stationId], function(err) {
        if (err) {
          log.error(`Error removing station ${stationId} for user ${user}: ${err.message}`);
          return reject(err);
        }
        if (this.changes === 0) {
          log.warning(`Station ${stationId} not found for user ${user}`);
        }
        resolve();
      });
    });
  }

  /**
   * Check if a user has a station in their list
   * @param {string} user
   * @param {number} stationId
   * @returns {Promise<boolean>}
   */
  hasStation(user, stationId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT 1 FROM user_stations WHERE user = ? AND station_id = ? LIMIT 1';
      this.#db.get(query, [user, stationId], (err, row) => {
        if (err) {
          log.error(`Error checking station ${stationId} for user ${user}: ${err.message}`);
          return reject(err);
        }
        resolve(!!row);
      });
    });
  }

  /**
   * Closes the database connection.
   * @returns {Promise<void>}
   */
  close() {
    return new Promise((resolve, reject) => {
      this.#db.close((err) => {
        if (err) {
          log.error(`Error closing database: ${err.message}`);
          return reject(err);
        }
        resolve();
      });
    });
  }
};