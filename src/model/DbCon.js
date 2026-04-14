const sqlite3 = require('sqlite3').verbose();

class DbCon {
  constructor(filePath) {
    if (!filePath) throw new Error('Database file path is required');

    this.db = new sqlite3.Database(filePath);

    this.connectionPromise = new Promise((resolve, reject) => {
      this.db.once('open', resolve);
      this.db.once('error', reject);
    });

    this.initializationPromise = this.connectionPromise.then(() => this.#init());
  }

  /**
   * pragams
   */
  get pragmas() {
    return [
      "PRAGMA journal_mode = WAL;",
      "PRAGMA synchronous = NORMAL;",
      "PRAGMA foreign_keys = ON;",
      "PRAGMA busy_timeout = 5000;",
      "PRAGMA temp_store = MEMORY;"
    ];
  }

  /**
   * schema
   */
  get schema() { return []; }

  /**
   * intialize the database connection
   * 
   * @returns {Promise}
   */
  #init() {
    const queries = [...this.pragmas, ...this.schema];

    return queries.reduce(
      (p, query) => p.then(() => this._runRaw(query)),
      Promise.resolve()
    );
  }

  /**
   * run a database query without the init function
   * 
   * @param {String} query 
   * @param {Array} params 
   * @param {String} errorMsg 
   * 
   * @returns {Promise}
   */
  _runRaw(query, params = [], errorMsg) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function (err) {
        if (err) {
          reject(errorMsg ? new Error(`${errorMsg}: ${err.message}`) : err);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * run a database query
   * 
   * @param {String} query 
   * @param {Array} params 
   * @param {String} errorMsg 
   * 
   * @returns {Promise}
   */
  async run(query, params = [], errorMsg) {
    await this.initializationPromise;
    return this._runRaw(query, params, errorMsg);
  }

  /**
   * run a get query
   * 
   * @param {String} query 
   * @param {Array} params 
   * 
   * @returns {Promise}
   */
  async get(query, params = []) {
    await this.initializationPromise;
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * run an all query
   * 
   * @param {String} query 
   * @param {Array} params
   *  
   * @returns {Promise}
   */
  async all(query, params = []) {
    await this.initializationPromise;
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * init database transaction
   * 
   * @param {Function} fn 
   * 
   * @returns {Object}
   */
  async transaction(fn) {
    await this.initializationPromise;
    await this._runRaw('BEGIN IMMEDIATE');
    try {
      const result = await fn();
      await this._runRaw('COMMIT');
      return result;
    } catch (err) {
      try {
        await this._runRaw('ROLLBACK');
      } catch (rollbackErr) {
        console.error(rollbackErr);
      }
      throw err;
    }
  }

  /**
   * close database
   * 
   * @returns {Promise}
   */
  close() {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = DbCon;