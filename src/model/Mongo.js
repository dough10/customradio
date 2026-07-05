const MongoBase = require('./MongoBase.js');

const collections = {
  REQUESTS: 'requests',
  CSP: 'csp',
  CSP_FAILS: 'csp-fails',
  DB_UPDATES: 'db-updates',
  ERRORS: 'errors'
};

class Mongo extends MongoBase {
  collections = Object.freeze(collections);

  get indexPlan() {
    return [
      {
        collection: this.collections.REQUESTS,
        indexes: [
          {
            spec: {
              time: 1
            },
            options: {
              name: "idx_requests_time"
            }
          }
        ]
      }
    ];
  }

  async getRequestCounts(hours) {
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new TypeError('hours must be a positive number');
    }

    const end = new Date();
    const start = new Date(end.getTime() - (hours * 60 * 60 * 1000));

    let DATAPOINTS = 96;

    let bucketMinutes;
    if (hours <= 1) {
      bucketMinutes = 1;
    } else if (hours <= 6) {
      bucketMinutes = 5;
    } else if (hours <= 24) {
      bucketMinutes = 15;
    } else {
      bucketMinutes = Math.ceil((hours * 60) / DATAPOINTS);
    }

    const bucketMs = bucketMinutes * 60 * 1000;

    const collection = this.getCollection(this.collections.REQUESTS);

    const results = await collection.aggregate([
      {
        $match: {
          time: {
            $gte: start,
            $lte: end
          }
        }
      }, {
        $group: {
          _id: {
            $toLong: {
              $dateTrunc: {
                date: "$time",
                unit: "minute",
                binSize: bucketMinutes
              }
            }
          },
          count: { $sum: 1 }
        }
      }, {
        $sort: {
          _id: 1
        }
      }
    ]).toArray();

    const lookup = new Map(results.map(r => [r._id, r.count]));

    const times = [];
    const counts = [];

    const align = (ts) => Math.floor(ts / bucketMs) * bucketMs;

    const startTs = align(start.getTime());
    const endTs = align(end.getTime());

    for (let t = startTs; t <= endTs; t += bucketMs) {
      times.push(new Date(t).toLocaleTimeString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
      counts.push(lookup.get(t) ?? 0);
    }

    return {
      counts,
      times
    };
  }

  async cleanupRequests(retentionDays = 90) {
    if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
      throw new TypeError('retentionDays must be a positive integer');
    }

    const cutoff = new Date(
      Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
    );

    const result = await this.getCollection(this.collections.REQUESTS)
      .deleteMany({
        time: { $lt: cutoff }
      });

    return {
      deleted: result.deletedCount,
      cutoff
    };
  }

  async logRequest(ip, method, path, query, status, userAgent, responseTime) {
    return this.getCollection(this.collections.REQUESTS).insertOne({
      time: new Date(),
      ip,
      method,
      path,
      query,
      status,
      userAgent,
      responseTime
    });
  }

  async logJSError(error) {
    return this.getCollection(this.collections.ERRORS).insertOne({ error });
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