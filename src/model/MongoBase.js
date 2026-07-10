const { MongoClient } = require("mongodb");

/**
 * Logger interface used by MongoBase.
 *
 * @typedef {Object} Logger
 * @property {(message: string) => void} info Informational logging.
 * @property {(message: string) => void} debug Debug logging.
 * @property {(message: string) => void} warning Warning logging.
 * @property {(message: string) => void} error Error logging.
 * @property {(message: string) => void} critical Critical error logging.
 */

const log = s => console.log(s);
const err = s => console.error(s);

const defaultLogger = {
  info: log,
  debug: log,
  warning: err,
  error: err,
  critical: err
}

const required = Object.keys(defaultLogger);

/**
 * Base class for MongoDB data access.
 *
 * Manages the MongoDB client lifecycle, collection initialization,
 * index creation, and common utility methods. Subclasses are expected
 * to provide collection definitions, index plans, and domain-specific
 * database operations.
 */
class MongoBase {

  /**
   * MongoDB client instance.
   *
   * @type {import("mongodb").MongoClient|null}
   */
  #mongoClient = null;

  /**
   * Logger implementation.
   *
   * @type {Logger}
   */
  #logger = null;

  /**
   * Database name.
   *
   * @type {string}
   */
  #dbname = null;

  /**
   * Initialized collection instances.
   *
   * @type {Record<string, import("mongodb").Collection>}
   */
  #db = {};

  /**
   * Indicates whether the client has been initialized.
   *
   * @type {boolean}
   */
  #connected = false;

  /**
   * Registered MongoDB collection names.
   *
   * Must be implemented by subclasses.
   *
   * @returns {Readonly<Record<string, string>>}
   * @throws {Error} Always thrown by the base implementation.
   */
  get collections() {
    throw new Error("collections getter must be implemented");
  };

  /**
   * MongoDB index creation plan.
   *
   * Must be implemented by subclasses.
   *
   * @returns {ReadonlyArray<Object>}
   * @throws {Error} Always thrown by the base implementation.
   */
  get indexPlan() {
    throw new Error("indexPlan getter must be implemented");
  };

  /**
   * Creates a MongoDB client instance.
   *
   * The connection is not established until {@link initConnection}
   * is called.
   *
   * @param {string} [url] MongoDB connection string.
   * @param {string} [dbname="default"] Database name.
   * @param {Logger} [logger=defaultLogger] Logger implementation.
   *
   * @throws {TypeError} If the logger does not implement the required methods.
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
   * Connects to MongoDB and initializes all configured collections.
   *
   * The configured indexes are created after the collections have
   * been initialized. Calling this method multiple times has no effect
   * after the first successful connection.
   *
   * @returns {Promise<void>}
   *
   * @throws {Error} If the MongoDB client has already been closed.
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
    this.#logger.debug(`MongoDB Connected: Collections - ${collectionList.join(', ')}`);
  }
  /**
   * Creates all configured indexes defined by {@link indexPlan}.
   *
   * Called automatically during {@link initConnection}. Existing indexes
   * are left unchanged by MongoDB.
   *
   * @returns {Promise<void>}
   *
   * @private
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
   * Returns an initialized MongoDB collection.
   *
   * @param {string} name Collection name.
   *
   * @returns {import("mongodb").Collection}
   *
   * @throws {Error} If the requested collection has not been initialized.
   */
  getCollection(name) {
    if (!this.#db[name]) {
      throw new Error(`Mongo collection "${name}" not initialized`);
    }
    return this.#db[name];
  }

  /**
   * Returns a Date instance.
   *
   * Exists primarily to allow deterministic unit testing by allowing
   * subclasses to override the source of the current time.
   *
   * @param {number|Date} [time] Timestamp or Date to wrap. If omitted,
   * the current date and time is returned.
   *
   * @returns {Date}
   */
  _now(time) {
    return time === undefined
      ? new Date()
      : new Date(time);
  }

  /**
   * Closes the MongoDB client and clears all initialized collections.
   *
   * Once closed, the instance cannot be reconnected.
   *
   * @returns {Promise<void>}
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