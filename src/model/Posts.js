const DbCon = require("./DbCon");

class Posts extends DbCon {
  get schema() {
    return [
      ...super.schema,

      `CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        markdown TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      )`,

      `CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        user_id TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )`,

      `CREATE INDEX IF NOT EXISTS idx_comments_post_id 
        ON comments(post_id);`,

      `CREATE INDEX IF NOT EXISTS idx_comments_user_id 
        ON comments(user_id);`
    ];
  }

  async allPosts(limit = 20, offset = 0) {
    const rows = await this.all(`
      SELECT 
        p.id,
        p.title,
        p.user_id,
        COUNT(c.id) AS comment_count
      FROM posts p
      LEFT JOIN comments c ON c.post_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      user_id: row.user_id,
      comment_count: Number(row.comment_count)
    }));
  }
}

module.exports = Posts;