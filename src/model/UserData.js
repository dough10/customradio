const DbCon = require('./DbCon.js');

module.exports = class UserData extends DbCon {
  get schema() {
    return [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workos_id TEXT NOT NULL UNIQUE,
        picture_url TEXT,
        first_name TEXT,
        last_name TEXT,
        locale TEXT,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS user_stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT NOT NULL,
        station_id INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user, station_id)
      );`
    ];
  }

  /**
   * inserts or updates user info
   * 
   * @param {Object} user
   * 
   * @returns {Promise<void>}
   */
  async createUser({ id, firstName, lastName, email, profilePictureUrl, locale }) {
    await this.run(`
      INSERT INTO users (workos_id, first_name, last_name, picture_url, email, locale)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(workos_id) DO UPDATE SET
        first_name = COALESCE(excluded.first_name, users.first_name),
        last_name = COALESCE(excluded.last_name, users.last_name),
        picture_url = COALESCE(excluded.picture_url, users.picture_url),
        email = COALESCE(excluded.email, users.email),
        locale = COALESCE(excluded.locale, users.locale)
    `, [id, firstName, lastName, profilePictureUrl, email, locale]);
  }

  /**
   * get a user by their workos id
   * 
   * @param {String} workosID 
   * 
   * @return {Promise<Object>}
   */
  async getUser(workosID) {
    return this.get(`SELECT * FROM users WHERE workos_id = ?`, [workosID]);
  }

  /**
   * Get all stations for a user (with full station details)
   * @param {string} user
   * @returns {Promise<Array>}
   */
  async userStations(user) {
    return this.all(`
      SELECT s.id, s.name, s.url, s.bitrate, s.genre, s.homepage, s.icon
      FROM user_stations us
      JOIN stations s ON us.station_id = s.id
      WHERE us.user = ?
      ORDER BY s.name COLLATE NOCASE ASC
    `, [user]);
  }

  /**
   * Add a station to a user's list
   * @param {string} user
   * @param {number} stationId
   * @returns {Promise<void>}
   */
  async addStation(user, stationId) {
    await this.run(`
      INSERT OR IGNORE INTO user_stations (user, station_id)
      VALUES (?, ?)
    `, [user, stationId]);
  }

  /**
   * Remove a station from a user's list
   * @param {string} user
   * @param {number} stationId
   * @returns {Promise<void>}
   */
  async removeStation(user, stationId) {
    await this.run('DELETE FROM user_stations WHERE user = ? AND station_id = ?', [user, stationId]);
  }

  /**
   * Check if a user has a station in their list
   * @param {string} user
   * @param {number} stationId
   * @returns {Promise<boolean>}
   */
  async hasStation(user, stationId) {
    const query = 'SELECT 1 FROM user_stations WHERE user = ? AND station_id = ? LIMIT 1';
    const row = await this.get(query, [user, stationId]);
    return !!row;
  }

  /**
   * Closes the database connection.
   * @returns {Promise<void>}
   */
  async close() {
    return super.close();
  }
};