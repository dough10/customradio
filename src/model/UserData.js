const DbCon = require('./DbCon.js');

module.exports = class UserData extends DbCon {
  get schema() {
    return [
      ...super.schema,
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
   * Get all stations for a user (with full station details)
   * @param {string} user
   * @returns {Promise<Array>}
   */
  async userStations(user) {
    const query = `
        SELECT s.id, s.name, s.url, s.bitrate, s.genre, s.homepage, s.icon
        FROM user_stations us
        JOIN stations s ON us.station_id = s.id
        WHERE us.user = ? AND s.online = 1 
        ORDER BY s.name COLLATE NOCASE ASC
      `;

    return this.all(query, [user]);
  }

  /**
   * Add a station to a user's list
   * @param {string} user
   * @param {number} stationId
   * @returns {Promise<void>}
   */
  async addStation(user, stationId) {
    const query = `
        INSERT OR IGNORE INTO user_stations (user, station_id)
        VALUES (?, ?)
      `;

    await this.run(query, [user, stationId]);
  }

  /**
   * Remove a station from a user's list
   * @param {string} user
   * @param {number} stationId
   * @returns {Promise<void>}
   */
  async removeStation(user, stationId) {
    const query = 'DELETE FROM user_stations WHERE user = ? AND station_id = ?';

    await this.run(query, [user, stationId]);
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