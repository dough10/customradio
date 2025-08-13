const sqlite3 = require('sqlite3').verbose();

const Logger = require('../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

module.exports = class UserData {
  #db;

  constructor(filePath) {
    if (!filePath) throw new Error('Database file path is required');

    const createTableQuery = `CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL UNIQUE,
      stations TEXT NOT NULL -- JSON stored as TEXT
    )`;

    this.#db = new sqlite3.Database(filePath, (err) => {
      if (err) {
        log.error(`Failed to open database: ${err.message}`);
        throw err;
      }

      this.#db.run(createTableQuery, (err) => {
        if (err) {
          log.error(`Error creating user_data table: ${err.message}`);
          throw err;
        }
      });
    });
  }

  /**
   * loads user stations from the database
   * 
   * @public
   * 
   * @param {string} user 
   * 
   * @returns {Promise<Array>}
   */
  userStations(user) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT stations FROM user_data WHERE user = ?';
      this.#db.get(query, [user], (err, row) => {
        if (err) {
          log.error(`Error fetching user stations: ${err.message}`);
          return reject(err);
        }
        resolve(row ? JSON.parse(row.stations) : []);
      });
    });
  }

  /**
   * saves user stations to the database
   * 
   * @param {string} user 
   * @param {Array} stations 
   * 
   * @returns {Promise<void>}
   */
  #saveStations(user, stations) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO user_data (user, stations)
        VALUES (?, ?)
        ON CONFLICT(user) DO UPDATE SET stations = excluded.stations
      `;
      this.#db.run(query, [user, JSON.stringify(stations)], function(err) {
        if (err) {
          log.error(`Error saving user stations: ${err.message}`);
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Checks if a station already exists for the user.
   * 
   * @private
   * 
   * @param {string} user - The user identifier.
   * @param {string} url - The URL of the station to check.
   * 
   * @returns {Promise<boolean>} - Resolves to true if the station exists, false otherwise.
   */
  #exists(user, url) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT stations FROM user_data WHERE user = ?';
      this.#db.get(query, [user], (err, row) => {
        if (err) {
          log.error(`Error checking station existence: ${err.message}`);
          return reject(err);
        }
        if (!row) return resolve(false);
        const stations = JSON.parse(row.stations);
        const exists = stations.some(station => station.url === url);
        resolve(exists);
      });
    });
  }
  
  /**
   * Adds a new station to the user's list of stations and saves it to the database.
   * 
   * @async
   * @public
   * 
   * @param {string} user - The user identifier.
   * @param {Object} station - The station object to be added.
   * 
   * @returns {Promise<void>}
   */
  async saveStation(user, station) {
    if (await this.#exists(user, station.url)) {
      log.warning(`Station ${station.url} already exists for user ${user}`);
      return;
    }
    const stations = await this.userStations(user);
    stations.push(station);
    stations.sort((a, b) => {
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
    return this.#saveStations(user, stations);
  }

  /**
   * Removes a station from the user's list of stations and updates the database.
   * 
   * @async
   * @public
   * 
   * @param {string} user - The user identifier.
   * @param {string} url - The URL of the station to be removed.
   * 
   * @returns {Promise<void>}
   */
  async removeStation(user, url) {
    const stations = await this.userStations(user);
    const filteredStations = stations.filter(station => station.url !== url);
    if (filteredStations.length === stations.length) {
      log.warning(`Station ${url} not found for user ${user}`);
      return;
    }
    return this.#saveStations(user, filteredStations);
  }

  /**
   * Closes the database connection.
   * 
   * @public
   * 
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
}