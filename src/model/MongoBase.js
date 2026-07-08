const { MongoClient } = require("mongodb");
const Logger = require("../util/logger");

const log = s => console.log(s);
const err = s => console.error(s);

const defaultLogger = {
  info: log,
  debug: log,
  warning: err,
  error: err,
  critical: err,
  security: log
}

const required = Object.keys(defaultLogger);

class MongoBase {
  #mongoClient = null;
  #logger = null;
  #dbname = null;
  #db = {};
  #connected = false;

  get collections() {
    throw new Error("collections getter must be implemented");
  };

  get indexPlan() {
    throw new Error("indexPlan getter must be implemented");
  };

  /**
   * creates mongodb connection instance
   * 
   * @param {String} url 
   * @param {String} dbname 
   * @param {Logger} logger 
   */
  constructor(url, dbname='default', logger=defaultLogger) {
    for (const fn of required) {
      if (typeof logger[fn] !== "function")
        throw new TypeError(`logger.${fn} must be a function`);
    }
    this.#dbname = dbname;
    this.#logger = logger;
    this.#mongoClient = new MongoClient(url || 'mongodb://127.0.0.1:27017', {
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    this.#mongoClient.on('close', _ => this.#logger.warning('MongoDB connection closed'));
    this.#mongoClient.on('error', err => this.#logger.error(`MongoDB error: ${err}`));
  }

  /**
   * initalize the mongodb instance
   * 
   * @returns {void}
   */
  async initConnection() {
    if (this.#connected) return;
    if (!this.#mongoClient) throw new Error("Mongo client has been closed.");
    await this.#mongoClient.connect();
    const db = this.#mongoClient.db(this.#dbname);
    const collections = this.collections;
    const collectionList = Object.values(collections);
    for (const name of collectionList) {
      this.#db[name] = db.collection(name);
    }
    await this.#ensureIndexes();
    this.#connected = true;
    this.#logger.debug(`MongoDB Connected: Collections ${collectionList.join(', ')}`);
  }

  /**
   * setup collection indexes
   */
  async #ensureIndexes() {
    for (const item of this.indexPlan) {
      if (!item.collection) continue;
      const col = this.getCollection(item.collection);
      for (const idx of item.indexes) {
        await col.createIndex(idx.spec, idx.options);
      }
    }
  }

  /**
   * returns a mongodb collection
   * 
   * @param {String} name collection requested
   * 
   * @returns {Object} mongodb collection instance
   */
  getCollection(name) {
    if (!this.#db[name]) {
      throw new Error(`Mongo collection "${name}" not initialized`);
    }
    return this.#db[name];
  }

  /**
   * Returns the current time.
   * Exists primarily to allow deterministic unit tests.
   * 
   * @param {Date} time 
   * 
   * @returns {Date}
   */
  _now(time) {
    return new Date(time);
  }

  /**
   * closes mongodb instance
   * 
   * @returns {void}
   */
  async close() {
    if (!this.#mongoClient) return;
    await this.#mongoClient.close();
    this.#db = {};
    this.#mongoClient = null;
    this.#connected = false;
  }
}

module.exports = MongoBase;