const DbCon = require('./DbCon.js');
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
  version TEXT NOT NULL
);`;

const paragraphsTable = `CREATE TABLE IF NOT EXISTS alert_paragraphs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id TEXT NOT NULL,
  content TEXT NOT NULL,
  position INTEGER NOT NULL CHECK(position >= 0),
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
  UNIQUE(alert_id, position)
);`;

const state = `CREATE TABLE IF NOT EXISTS alert_state (
  alert_id TEXT,
  version TEXT,
  dismissed INTEGER DEFAULT 0,
  dismissed_at INTEGER,
  PRIMARY KEY (alert_id, version),
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);`;

const DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * DAY;

class Alerts extends DbCon {
  get schema() {
    return [
      alerts,
      paragraphsTable, 
      state,
      `CREATE INDEX IF NOT EXISTS idx_alert_state_dismissed ON alert_state(dismissed);`,
      `CREATE INDEX IF NOT EXISTS idx_alert_paragraphs_alert_id ON alert_paragraphs(alert_id);`,
      `CREATE INDEX IF NOT EXISTS idx_alerts_expires_at ON alerts(expires_at);`,
    ];
  }

  async replaceParagraphs(alertId, paragraphs) {
    await this.run(`DELETE FROM alert_paragraphs WHERE alert_id = ?`, [alertId]);

    if (paragraphs.length === 0) return;

    const values = paragraphs.map(() => '(?, ?, ?)').join(',');
    const params = paragraphs.flatMap((p, i) => [alertId, p, i]);

    await this.run(
      `INSERT INTO alert_paragraphs (alert_id, content, position)
      VALUES ${values}`,
      params
    );
  }

  async createAlert({ 
    id, 
    title, 
    paragraphs, 
    version = hash(JSON.stringify({ title, paragraphs })),
    expiresAt = Date.now() + THIRTY_DAYS, 
    priority = 0 
  }) {
    return this.transaction(async () => {
      const now = Date.now();

      await this.run(
        `INSERT INTO alerts (id, title, created_at, expires_at, priority, version)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          expires_at = excluded.expires_at,
          priority = excluded.priority,
          version = excluded.version`,
        [id, title, now, expiresAt, priority, version]
      );

      await this.replaceParagraphs(id, paragraphs);
    });
  }

  async getActiveAlerts() {
    const now = Date.now();

    const rows = await this.all(`
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

  }

  async dismissAlert(id, version) {
    const now = Date.now();

    await this.run(`
      INSERT INTO alert_state (alert_id, version, dismissed, dismissed_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(alert_id, version) DO UPDATE SET
        dismissed = 1,
        dismissed_at = excluded.dismissed_at
    `, [id, version, now]);
  }

  async isDismissed(id, version) {
    const row = await this.get(
      `SELECT dismissed FROM alert_state 
      WHERE alert_id = ? AND version = ?`,
      [id, version]
    );

    return row?.dismissed === 1;
  }

  async cleanupExpired() {
    const now = Date.now();

    await this.run(
      `DELETE FROM alerts WHERE expires_at IS NOT NULL AND expires_at <= ?`,
      [now]
    );
  }

  async cleanupOldVersions() {
    await this.run(`
      DELETE FROM alert_state
      WHERE NOT EXISTS (
        SELECT 1 FROM alerts a
        WHERE a.id = alert_state.alert_id
          AND a.version = alert_state.version
      )
    `);
  }
}

module.exports = Alerts;