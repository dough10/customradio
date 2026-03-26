const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

function hash(input) {
  return crypto
    .createHash('sha256')
    .update(input)
    .digest('hex');
}

const alerts = `CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY, 
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  priority INTEGER DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1
);`;

const paragraphs = `CREATE TABLE IF NOT EXISTS alert_paragraphs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id TEXT NOT NULL,
  content TEXT NOT NULL,
  position INTEGER NOT NULL CHECK(position >= 0),
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
  UNIQUE(alert_id, position)
);`;

const state = `CREATE TABLE IF NOT EXISTS alert_state (
  alert_id TEXT,
  version INTEGER,
  dismissed INTEGER DEFAULT 0,
  dismissed_at INTEGER,
  PRIMARY KEY (alert_id, version),
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);`;

class Alerts {
  constructor(filePath) {
    if (!filePath) throw new Error('Database file path is required');

    this.db = new sqlite3.Database(filePath, (err) => {
      if (err) {
        throw new Error(`Failed to connect to database: ${err.message}`);
      }
    });
    this.initializationPromise = this.#init();
  }

  #init() {
    const run = (query, errorMsg) => {
      return new Promise((resolve, reject) => {
        this.db.run(query, err => {
          if (err) {
            reject(new Error(`${errorMsg}: ${err.message}`));
          } else {
            resolve();
          }
        });
      });
    };

    const pragmas = [
      {
        query: "PRAGMA journal_mode = WAL;",
        errorMsg: "Failed to enable WAL mode"
      },
      {
        query: "PRAGMA synchronous = NORMAL;",
        errorMsg: "Failed to set synchronous mode"
      },
      {
        query: "PRAGMA foreign_keys = ON;",
        errorMsg: "Failed to enable foreign keys"
      }
    ];

    const schema = [
      {
        query: alerts,
        errorMsg: 'Failed to create alerts table'
      }, {
        query: paragraphs, 
        errorMsg: 'Failed to create alert_paragraphs table'
      }, {
        query: state,
        errorMsg: 'Failed to create alert_state table'
      }, {
        query: `CREATE INDEX IF NOT EXISTS idx_alert_state_dismissed 
          ON alert_state(dismissed);`,
        errorMsg: 'Failed to create index for alert_state'
      }, {
        query: `CREATE INDEX IF NOT EXISTS idx_alert_paragraphs_alert_id 
          ON alert_paragraphs(alert_id);`,
        errorMsg: 'Failed to create index for alert_paragraphs'
      }, {
        query: `CREATE INDEX IF NOT EXISTS idx_alerts_expires_at 
          ON alerts(expires_at);`,
        errorMsg: 'Failed to create index for alerts_expires'
      }
    ];

    return [...pragmas, ...schema].reduce((promise, { query, errorMsg }) => {
      return promise.then(() => run(query, errorMsg));
    }, Promise.resolve());    
  }

  /**
   * Ensure the database is initialized before running a query.
   * 
   * @param {Function} fn - The function to run after initialization.
   * 
   * @returns {Promise} A promise that resolves when the function completes.
   */
  async _ensureInit(fn) {
    await this.initializationPromise;
    return fn();
  }

  _run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  _get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  _all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async createAlert({ 
    id, 
    title, 
    paragraphs, 
    version = hash(JSON.stringify({ title, paragraphs })),
    expiresAt = null, 
    priority = 0 
  }) {
    return this._ensureInit(async () => {
      await this._run('BEGIN');
      try {
        const now = Date.now();

        await this._run(
          `INSERT INTO alerts (id, title, created_at, expires_at, priority, version)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            expires_at = excluded.expires_at,
            priority = excluded.priority,
            version = excluded.version`,
          [id, title, now, expiresAt, priority, version]
        );

        await this._run(`DELETE FROM alert_paragraphs WHERE alert_id = ?`, [id]);

        if (paragraphs.length > 0) {
          const values = paragraphs.map((_, i) => '(?, ?, ?)').join(',');
          const params = paragraphs.flatMap((p, i) => [id, p, i]);

          await this._run(
            `INSERT INTO alert_paragraphs (alert_id, content, position)
            VALUES ${values}`,
            params
          );
        }
        await this._run('COMMIT');
      } catch (err) {
        await this._run('ROLLBACK');
        throw err;
      }
    });
  }

  async getActiveAlerts() {
    return this._ensureInit(async () => {
      const now = Date.now();

      const rows = await this._all(`
        SELECT 
          a.id,
          a.title,
          a.priority,
          a.version,
          p.content,
          p.position
        FROM alerts a
        LEFT JOIN alert_state s 
          ON a.id = s.alert_id AND a.version = s.version
        LEFT JOIN alert_paragraphs p 
          ON a.id = p.alert_id
        WHERE (s.dismissed IS NULL OR s.dismissed = 0)
          AND (a.expires_at IS NULL OR a.expires_at > ?)
        ORDER BY 
          a.priority DESC, 
          a.created_at DESC, 
          p.position ASC,
          p.id ASC
      `, [now]);

      const map = new Map();

      for (const row of rows) {
        if (!map.has(row.id)) {
          map.set(row.id, {
            id: row.id,
            title: row.title,
            version: row.version,
            priority: row.priority,
            paragraphs: []
          });
        }

        if (row.content !== null) {
          map.get(row.id).paragraphs.push(row.content);
        }
      }

      return Array.from(map.values());
    });
  }

  async dismissAlert(id, version) {
    return this._ensureInit(async () => {
      const now = Date.now();

      await this._run(`
        INSERT INTO alert_state (alert_id, version, dismissed, dismissed_at)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(alert_id, version) DO UPDATE SET
          dismissed = 1,
          dismissed_at = excluded.dismissed_at
      `, [id, version, now]);
    });
  }

  async isDismissed(id, version) {
    return this._ensureInit(async () => {
      const row = await this._get(
        `SELECT dismissed FROM alert_state 
        WHERE alert_id = ? AND version = ?`,
        [id, version]
      );

      return row?.dismissed === 1;
    });
  }

  async cleanupExpired() {
    return this._ensureInit(async () => {
      const now = Date.now();

      await this._run(
        `DELETE FROM alerts WHERE expires_at IS NOT NULL AND expires_at <= ?`,
        [now]
      );
    });
  }

  async cleanupOldVersions() {
    return this._ensureInit(async () => {
      await this._run(`
        DELETE FROM alert_state
        WHERE NOT EXISTS (
          SELECT 1 FROM alerts a
          WHERE a.id = alert_state.alert_id
            AND a.version = alert_state.version
        )
      `);
    });
  }
}

module.exports = Alerts;