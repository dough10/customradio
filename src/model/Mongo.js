const version = require('../../package.json').version;

const MongoBase = require('./MongoBase.js');

/**
 * MongoDB aggregation result for a request bucket.
 *
 * @typedef {Object} RequestBucket
 * @property {number} _id Bucket timestamp (milliseconds since epoch).
 * @property {number} count Number of requests in the bucket.
 */

/**
 * Graph-ready request count data.
 *
 * @typedef {Object} GraphData
 * @property {number[]} counts Request counts for each bucket.
 * @property {string[]} times Formatted timestamps for each bucket.
 */

/**
 * Request count statistics.
 *
 * @typedef {GraphData & {
 *   totalRequests: number,
 *   averagePerHour: number
 * }} RequestCounts
 */

/**
 * Result returned after cleaning expired request logs.
 *
 * @typedef {Object} CleanupResult
 * @property {number} deleted Number of deleted documents.
 * @property {Date} cutoff Cutoff timestamp used for deletion.
 */

/**
 * Application MongoDB collection names.
 *
 * @typedef {Object} Collections
 * @property {string} REQUESTS HTTP request log collection.
 * @property {string} CSP Content Security Policy reports.
 * @property {string} CSP_FAILS Failed CSP report processing.
 * @property {string} DB_UPDATES Database update history.
 * @property {string} ERRORS JavaScript error reports.
 */

/**
 * MongoDB index definition.
 *
 * @typedef {Object} IndexDefinition
 * @property {Object<string, 1|-1|"text"|"hashed">} spec Index key specification.
 * @property {import("mongodb").CreateIndexesOptions} [options] Index creation options.
 */

/**
 * Collection index configuration.
 *
 * @typedef {Object} CollectionIndexes
 * @property {string} collection Collection name.
 * @property {IndexDefinition[]} indexes Indexes to create.
 */

/**
 * @type {Collections}
 */
const collections = {
  REQUESTS: 'requests',
  CSP: 'csp',
  CSP_FAILS: 'csp-fails',
  DB_UPDATES: 'db-updates',
  ERRORS: 'errors'
};

/**
 * @type {CollectionIndexes[]}
 */
const indexes = [
  {
    collection: collections.REQUESTS,
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
  }, {
    collection: collections.CSP,
    indexes: [
      {
        spec: {
          fingerprint: 1
        },
        options: {
          name: "idx_csp_fingerprint",
          unique: true
        }
      }
    ]
  }
];

/**
 * Graph data formatting options.
 *
 * @type {Intl.DateTimeFormatOptions}
 */
const GRAPH_DATE_CONFIG = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

/**
 * get the bucket size in mins
 * 
 * @param {number} hours
 * 
 * @returns {number}
 */
function getBucketSize(hours) {
  const DATAPOINTS = 96;
  if (hours <= 1) return 1;
  if (hours <= 6) return 5;
  if (hours <= 24) return 15;
  return Math.ceil((hours * 60) / DATAPOINTS);
}

/**
 * Converts MongoDB aggregation results into graph-ready data.
 *
 * @param {RequestBucket[]} results
 * @param {Date} start
 * @param {Date} end
 * @param {number} bucketMs
 * @param {(time?: number) => Date} now
 * @returns {GraphData}
 */
function processGraphData(results, start, end, bucketMs, now) {
  const lookup = new Map(results.map(r => [r._id, r.count]));

  const times = [];
  const counts = [];

  const align = (ts) => Math.floor(ts / bucketMs) * bucketMs;

  const startTs = align(start.getTime());
  const endTs = align(end.getTime());

  for (let t = startTs; t <= endTs; t += bucketMs) {
    times.push(now(t).toLocaleTimeString([], GRAPH_DATE_CONFIG));
    counts.push(lookup.get(t) ?? 0);
  }
  return { counts, times };
}

[collections, indexes].forEach(Object.freeze);

/**
 * MongoDB data access layer for application logging and analytics.
 *
 * Provides methods for:
 * - Logging HTTP requests
 * - Recording JavaScript errors
 * - Recording CSP reports and failures
 * - Recording database update results
 * - Retrieving request count graph data
 * - Cleaning up expired request records
 *
 * @extends MongoBase
 */
class Mongo extends MongoBase {

  /**
   * Registered MongoDB collection names.
   *
   * @returns {Readonly<Record<string, string>>}
   */
  get collections() {
    return collections;
  }

  /**
   * MongoDB index creation plan.
   *
   * Executed automatically during {@link initConnection}.
   *
   * @returns {ReadonlyArray<Object>}
   */
  get indexPlan() {
    return indexes;
  }

  /**
   * Retrieves request statistics for the requested time period.
   *
   * Request counts are grouped into time buckets suitable for graphing.
   * The returned object contains graph labels, bucket counts, total
   * requests, and the average requests per hour.
   *
   * @param {number} hours Number of hours to include.
   *
   * @returns {Promise<RequestCounts>}
   *
   * @throws {TypeError} If {@link hours} is not a positive number.
   */
  async getRequestCounts(hours) {
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new TypeError('hours must be a positive number');
    }

    const end = this._now();
    const start = this._now(end.getTime() - (hours * 60 * 60 * 1000));

    const bucketMinutes = getBucketSize(hours);

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

    const graphData = processGraphData(results, start, end, bucketMs, this._now.bind(this));

    const totalRequests = results.reduce((sum, r) => sum + r.count, 0);

    return {
      averagePerHour: totalRequests / hours,
      ...graphData,
      totalRequests
    };
  }

  /**
   * Deletes request log entries older than the specified retention period.
   *
   * @param {number} [retentionDays=90] Number of days of request history to keep.
   *
   * @returns {Promise<CleanupResult>}
   *
   * @throws {TypeError} If {@link retentionDays} is not a positive integer.
   */
  async cleanupRequests(retentionDays = 90) {
    if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
      throw new TypeError('retentionDays must be a positive integer');
    }

    const cutoff = this._now(
      this._now().getTime() - (retentionDays * 24 * 60 * 60 * 1000)
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

  /**
   * Records an HTTP request.
   *
   * @param {string} ip Client IP address.
   * @param {string} method HTTP request method.
   * @param {string} path Request path.
   * @param {Object} query Parsed query parameters.
   * @param {number} status HTTP response status code.
   * @param {string} userAgent User-Agent header.
   * @param {number} responseTime Request duration in milliseconds.
   *
   * @returns {Promise<import("mongodb").InsertOneResult>}
   */
  async logRequest(ip, method, path, query, status, userAgent, responseTime) {
    return this.getCollection(this.collections.REQUESTS).insertOne({
      time: this._now(),
      ip,
      method,
      path,
      query,
      status,
      userAgent,
      version,
      responseTime
    });
  }

  /**
   * Records a JavaScript error report.
   *
   * @param {*} error Error payload.
   *
   * @returns {Promise<import("mongodb").InsertOneResult>}
   */
  async logJSError(error) {
    return this.getCollection(this.collections.ERRORS).insertOne({ error, version });
  }

  /**
   * Records the results of a database update operation.
   *
   * @param {number} changed Number of records changed.
   * @param {Date} start Update start time.
   * @param {Date} end Update completion time.
   * @param {string} type Update type.
   *
   * @returns {Promise<import("mongodb").InsertOneResult>}
   */
  async logDBUpdateResults(changed, start, end, type) {
    return this.getCollection(this.collections.DB_UPDATES).insertOne({
      changed,
      start,
      end,
      type,
      version
    });
  }

  /**
   * Records a Content Security Policy report.
   *
   * Existing reports with the same fingerprint are updated by
   * incrementing their occurrence count and updating the last
   * seen timestamp.
   *
   * @param {Object} cspReport Parsed CSP report.
   *
   * @returns {Promise<import("mongodb").UpdateResult>}
   */
  async logCSP(cspReport) {
    return this.getCollection(this.collections.CSP).updateOne({
      fingerprint: cspReport.fingerprint
    }, {
      $setOnInsert: cspReport,
      $inc: {
        count: 1
      },
      $set: {
        lastSeen: this._now()
      }
    }, {
      upsert: true
    });
  }

  /**
   * Records a CSP report that could not be processed.
   *
   * @param {Object} baseObj Common request information.
   * @param {*} error Processing error.
   * @param {*} body Raw request body.
   * @param {string} contentType Request Content-Type header.
   * @param {string} bodyType Parsed body type.
   *
   * @returns {Promise<import("mongodb").InsertOneResult>}
   */
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