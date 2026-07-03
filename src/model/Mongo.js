const MongoBase = require('./MongoBase.js');

class Mongo extends MongoBase {
  collections = {
    REQUESTS: 'requests',
    CSP: 'csp',
    CSP_FAILS: 'csp-fails',
    DB_UPDATES: 'db-updates',
    ERRORS: 'errors'
  };

  async logRequest(ip, method, path, query, status, responseTime) {
    return this.getCollection(this.collections.REQUESTS).insertOne({
      time: new Date(),
      ip,
      method,
      path,
      query,
      status,
      responseTime
    });
  }

  async logJSError(error) {
    return this.getCollection(this.collections.ERRORS).insertOne(error);
  }

  async logDBUpdateResults(changed, start, end, type) {
    return this.getCollection(this.collections.DB_UPDATES).insertOne({
      changed,
      start,
      end,
      type,
      version: require('../../package.json').version
    });
  }

  async logCSP(cspReport) {
    return this.getCollection(this.collections.CSP).updateOne({
      fingerprint: cspReport.fingerprint
    }, {
      $setOnInsert: cspReport,
      $inc: {
        count: 1
      },
      $set: {
        lastSeen: new Date()
      }
    }, {
      upsert: true
    });
  }

  async logCSPFail(baseObj, error, body, contentType, bodyType) {
    return this.getCollection(this.collections.CSP_FAILS).insertOne({
      ...baseObj,
      error,
      body,
      contentType,
      bodyType
    });
  }
}

module.exports = Mongo;