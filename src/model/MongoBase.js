const { MongoClient } = require("mongodb");

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

class MongoBase {
  #mongoClient = null;
  #logger = null;
  #dbname = null;
  #db = {};

  collections = {};

  get indexPlan() {
    return [];
  };

  constructor(url, dbname='default', logger=defaultLogger) {
    if (!logger) {
      throw new TypeError('logger is required');
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

  async initConnection() {
    await this.#mongoClient.connect();
    const db = this.#mongoClient.db(this.#dbname);
    const collectionList = Object.values(this.collections);
    for (const name of collectionList) {
      this.#db[name] = db.collection(name);
    }
    await this.#ensureIndexes();
    this.#logger.debug(`MongoDB Connected: Collections ${collectionList.join(', ')}`);
  }

  async #ensureIndexes() {
    for (const item of this.indexPlan) {
      if (!item.collection) continue;
      const col = this.getCollection(item.collection);
      for (const idx of item.indexes) {
        await col.createIndex(idx.spec, idx.options);
      }
    }
  }

  getCollection(name) {
    if (!this.#db[name]) {
      throw new Error(`Mongo collection "${name}" not initialized`);
    }
    return this.#db[name];
  }

  async close() {
    if (!this.#mongoClient) return;
    await this.#mongoClient.close();
    this.#db = {};
  }
}

module.exports = MongoBase;