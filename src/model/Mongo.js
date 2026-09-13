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
  STASH: 'stash',
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
  }, {
    collection: collections.DB_UPDATES,
    indexes: [
      {
        spec: {
          "end.time": -1
        },
        options: {
          name: "idx_db_updates_end_time"
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
function getBucketSize(hours, targetPoints = 96) {
  const ideal = (hours * 60) / targetPoints;
  const buckets = [1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440];

  return buckets.find(b => b >= ideal) ?? Math.ceil(ideal);
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
   * Retrieves aggregated analytics for HTTP requests.
   *
   * Long-running endpoints such as `/logs` and `/progress` are included
   * in request counts, but excluded from response-time calculations.
   *
   * @param {number} [hours=24] Number of hours to analyze.
   *
   * @returns {Promise<{
   *   start: Date,
   *   end: Date,
   *   totalRequests: number,
   *   uniqueIPs: number,
   *   averageResponseTime: number,
   *   requestsPerHour: number,
   *   statusCodes: Array<{status: number, count: number}>,
   *   methods: Array<{method: string, count: number}>,
   *   paths: Array<{
   *     path: string,
   *     count: number,
   *     averageResponseTime: number
   *   }>,
   *   browsers: Array<{browser: string, count: number}>,
   *   operatingSystems: Array<{os: string, count: number}>,
   *   times: string[], 
   *   counts: number[],
   *   interval: number
   * }>}
   *
   * @throws {TypeError} If hours is not a positive number.
   */
  async getRequestAnalytics(hours = 24) {
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new TypeError('hours must be a positive number');
    }

    const end = this._now();
    const start = this._now(
      end.getTime() - (hours * 60 * 60 * 1000)
    );

    const bucketMinutes = getBucketSize(hours);
    const bucketMs = bucketMinutes * 60 * 1000;

    const collection = this.getCollection(this.collections.REQUESTS);

    const excludedResponseTimePaths = [
      '/logs',
      '/progress'
    ];

    const [result] = await collection.aggregate([
      {
        $match: {
          time: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRequests: {
                  $sum: 1
                },
                uniqueIPs: {
                  $addToSet: '$ip'
                },
                averageResponseTime: {
                  $avg: {
                    $cond: [
                      {
                        $in: [
                          '$path',
                          excludedResponseTimePaths
                        ]
                      },
                      null,
                      '$responseTime'
                    ]
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                totalRequests: 1,
                uniqueIPs: {
                  $size: '$uniqueIPs'
                },
                averageResponseTime: {
                  $round: [
                    {
                      $ifNull: [
                        '$averageResponseTime',
                        0
                      ]
                    },
                    2
                  ]
                }
              }
            }
          ],

          non4xxRequests: [
            {
              $match: {
                $or: [
                  { status: { $lt: 400 } },
                  { status: { $gte: 500 } }
                ]
              }
            },
            {
              $count: 'total'
            }
          ],

          statusCodes: [
            {
              $group: {
                _id: '$status',
                count: {
                  $sum: 1
                }
              }
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1
              }
            },
            {
              $sort: {
                count: -1
              }
            }
          ],

          methods: [
            {
              $group: {
                _id: '$method',
                count: {
                  $sum: 1
                }
              }
            },
            {
              $project: {
                _id: 0,
                method: '$_id',
                count: 1
              }
            },
            {
              $sort: {
                count: -1
              }
            }
          ],

          paths: [
            {
              $group: {
                _id: '$path',
                count: {
                  $sum: 1
                },
                averageResponseTime: {
                  $avg: {
                    $cond: [
                      {
                        $in: [
                          '$path',
                          excludedResponseTimePaths
                        ]
                      },
                      null,
                      '$responseTime'
                    ]
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                path: '$_id',
                count: 1,
                averageResponseTime: {
                  $round: [
                    {
                      $ifNull: [
                        '$averageResponseTime',
                        0
                      ]
                    },
                    2
                  ]
                }
              }
            },
            {
              $sort: {
                count: -1
              }
            },
            {
              $limit: 25
            }
          ],

          browsers: [
            {
              $group: {
                _id: '$userAgent.browser.name',
                count: {
                  $sum: 1
                }
              }
            },
            {
              $project: {
                _id: 0,
                browser: {
                  $ifNull: [
                    '$_id',
                    'Unknown'
                  ]
                },
                count: 1
              }
            },
            {
              $sort: {
                count: -1
              }
            }
          ],

          operatingSystems: [
            {
              $group: {
                _id: '$userAgent.os.name',
                count: {
                  $sum: 1
                }
              }
            },
            {
              $project: {
                _id: 0,
                os: {
                  $ifNull: [
                    '$_id',
                    'Unknown'
                  ]
                },
                count: 1
              }
            },
            {
              $sort: {
                count: -1
              }
            }
          ],

          graph: [
            {
              $group: {
                _id: {
                  $toLong: {
                    $dateTrunc: {
                      date: '$time',
                      unit: 'minute',
                      binSize: bucketMinutes
                    }
                  }
                },
                count: {
                  $sum: 1
                }
              }
            },
            {
              $sort: {
                _id: 1
              }
            }
          ]
        }
      }
    ]).toArray();

    const stats = result?.summary[0] ?? {
      totalRequests: 0,
      uniqueIPs: 0,
      averageResponseTime: 0
    };

    const non4xxRequests = result?.non4xxRequests[0]?.total ?? 0;

    return {
      start,
      end,

      totalRequests: stats.totalRequests,
      non4xxRequests,
      uniqueIPs: stats.uniqueIPs,
      averageResponseTime: stats.averageResponseTime,

      requestsPerHour: Number(
        (stats.totalRequests / hours).toFixed(2)
      ),

      statusCodes: result?.statusCodes ?? [],
      methods: result?.methods ?? [],
      paths: result?.paths ?? [],
      browsers: result?.browsers ?? [],
      operatingSystems: result?.operatingSystems ?? [],

      ...processGraphData(
        result?.graph ?? [],
        start,
        end,
        bucketMs,
        this._now.bind(this)
      ),

      interval: bucketMs
    };
  }

  // async getRequestAnalytics(hours = 24) {
  //   if (!Number.isFinite(hours) || hours <= 0) {
  //     throw new TypeError('hours must be a positive number');
  //   }

  //   const end = this._now();
  //   const start = this._now(
  //     end.getTime() - (hours * 60 * 60 * 1000)
  //   );

  //   const bucketMinutes = getBucketSize(hours);

  //   const bucketMs = bucketMinutes * 60 * 1000;

  //   const collection = this.getCollection(this.collections.REQUESTS);

  //   const excludedResponseTimePaths = [
  //     '/logs',
  //     '/progress'
  //   ];

  //   const [
  //     summary,
  //     statusCodes,
  //     methods,
  //     paths,
  //     browsers,
  //     operatingSystems,
  //     rawGraphData
  //   ] = await Promise.all([
  //     collection.aggregate([
  //       {
  //         $match: {
  //           time: {
  //             $gte: start,
  //             $lte: end
  //           }
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: null,
  //           totalRequests: {
  //             $sum: 1
  //           },
  //           uniqueIPs: {
  //             $addToSet: '$ip'
  //           },
  //           averageResponseTime: {
  //             $avg: {
  //               $cond: [
  //                 {
  //                   $in: [
  //                     '$path',
  //                     excludedResponseTimePaths
  //                   ]
  //                 },
  //                 null,
  //                 '$responseTime'
  //               ]
  //             }
  //           }
  //         }
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           totalRequests: 1,
  //           uniqueIPs: {
  //             $size: '$uniqueIPs'
  //           },
  //           averageResponseTime: {
  //             $round: [
  //               {
  //                 $ifNull: [
  //                   '$averageResponseTime',
  //                   0
  //                 ]
  //               },
  //               2
  //             ]
  //           }
  //         }
  //       }
  //     ]).toArray(),

  //     collection.aggregate([
  //       {
  //         $match: {
  //           time: {
  //             $gte: start,
  //             $lte: end
  //           }
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: '$status',
  //           count: {
  //             $sum: 1
  //           }
  //         }
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           status: '$_id',
  //           count: 1
  //         }
  //       },
  //       {
  //         $sort: {
  //           count: -1
  //         }
  //       }
  //     ]).toArray(),

  //     collection.aggregate([
  //       {
  //         $match: {
  //           time: {
  //             $gte: start,
  //             $lte: end
  //           }
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: '$method',
  //           count: {
  //             $sum: 1
  //           }
  //         }
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           method: '$_id',
  //           count: 1
  //         }
  //       },
  //       {
  //         $sort: {
  //           count: -1
  //         }
  //       }
  //     ]).toArray(),

  //     collection.aggregate([
  //       {
  //         $match: {
  //           time: {
  //             $gte: start,
  //             $lte: end
  //           }
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: '$path',
  //           count: {
  //             $sum: 1
  //           },
  //           averageResponseTime: {
  //             $avg: {
  //               $cond: [
  //                 {
  //                   $in: [
  //                     '$path',
  //                     excludedResponseTimePaths
  //                   ]
  //                 },
  //                 null,
  //                 '$responseTime'
  //               ]
  //             }
  //           }
  //         }
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           path: '$_id',
  //           count: 1,
  //           averageResponseTime: {
  //             $round: [
  //               {
  //                 $ifNull: [
  //                   '$averageResponseTime',
  //                   0
  //                 ]
  //               },
  //               2
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         $sort: {
  //           count: -1
  //         }
  //       },
  //       {
  //         $limit: 25
  //       }
  //     ]).toArray(),

  //     collection.aggregate([
  //       {
  //         $match: {
  //           time: {
  //             $gte: start,
  //             $lte: end
  //           }
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: '$userAgent.browser.name',
  //           count: {
  //             $sum: 1
  //           }
  //         }
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           browser: {
  //             $ifNull: [
  //               '$_id',
  //               'Unknown'
  //             ]
  //           },
  //           count: 1
  //         }
  //       },
  //       {
  //         $sort: {
  //           count: -1
  //         }
  //       }
  //     ]).toArray(),

  //     collection.aggregate([
  //       {
  //         $match: {
  //           time: {
  //             $gte: start,
  //             $lte: end
  //           }
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: '$userAgent.os.name',
  //           count: {
  //             $sum: 1
  //           }
  //         }
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           os: {
  //             $ifNull: [
  //               '$_id',
  //               'Unknown'
  //             ]
  //           },
  //           count: 1
  //         }
  //       },
  //       {
  //         $sort: {
  //           count: -1
  //         }
  //       }
  //     ]).toArray(),

  //     collection.aggregate([
  //       {
  //         $match: {
  //           time: {
  //             $gte: start,
  //             $lte: end
  //           }
  //         }
  //       }, {
  //         $group: {
  //           _id: {
  //             $toLong: {
  //               $dateTrunc: {
  //                 date: "$time",
  //                 unit: "minute",
  //                 binSize: bucketMinutes
  //               }
  //             }
  //           },
  //           count: { $sum: 1 }
  //         }
  //       }, {
  //         $sort: {
  //           _id: 1
  //         }
  //       }
  //     ]).toArray()
  //   ]);

  //   const stats = summary[0] ?? {
  //     totalRequests: 0,
  //     uniqueIPs: 0,
  //     averageResponseTime: 0
  //   };

  //   return {
  //     start,
  //     end,

  //     totalRequests: stats.totalRequests,
  //     uniqueIPs: stats.uniqueIPs,
  //     averageResponseTime: stats.averageResponseTime,

  //     requestsPerHour: Number(
  //       (stats.totalRequests / hours).toFixed(2)
  //     ),

  //     statusCodes,
  //     methods,
  //     paths,
  //     browsers,
  //     operatingSystems,
  //     ...processGraphData(rawGraphData, start, end, bucketMs, this._now.bind(this)),
  //     interval: bucketMs
  //   };
  // }

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
   * Returns the most recently completed database update.
   *
   * @returns {Promise<Object|null>}
   */
  async getLastDBUpdate() {
    return this.getCollection(this.collections.DB_UPDATES).findOne(
      {}, {
        sort: { "end.time": -1 }
      }
    );
  }

  /**
   * Retrieves a paginated list of stashed stations.
   *
   * @param {number} [limit=50] Maximum number of stations to return.
   * @param {number} [offset=0] Number of stations to skip.
   *                                                 
   * @returns {Promise<Object[]>}
   *
   * @throws {TypeError} If limit or offset are invalid.
   */
  async getPaginatedStations(limit = 50, offset = 0) {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new TypeError("limit must be a positive integer");
    }

    if (!Number.isInteger(offset) || offset < 0) {
      throw new TypeError("offset must be a non-negative integer");
    }

    return this.getCollection(this.collections.STASH)
      .find({}).skip(offset)
      .limit(limit).toArray();
  }

  /**
   * stores scraped stations in mongo as temp storage
   * 
   * @param {Array} jsonArray
   * 
   * @returns {???}
   */
  async stashStations(jsonArray) {
    return this.getCollection(this.collections.STASH).insertMany(jsonArray);
  }

  /**
   * Removes all stations from the stash collection.
   *
   * @returns {Promise<{
   *   deleted: number
   * }>}
   */
  async clearStash() {
    const result = await this.getCollection(this.collections.STASH).deleteMany({});
    return { 
      deleted: result.deletedCount 
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
    return this.getCollection(this.collections.ERRORS).insertOne({ 
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      time: this._now(),
      version
    });
  }

  /**
   * Records the results of a database update operation.
   *
   * @param {number} changed Number of records changed.
   * @param {Date} start Update start object.
   * @param {Date} end Update completion object.
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