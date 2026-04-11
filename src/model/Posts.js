const DbCon = require("./DbCon.js");

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

      'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);',

      `CREATE INDEX IF NOT EXISTS idx_comments_post_id 
        ON comments(post_id);`,

      `CREATE INDEX IF NOT EXISTS idx_comments_user_id 
        ON comments(user_id);`
    ];
  }

  async getPostList(limit = 20, offset = 0) {
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

  async getPost(id) {
    const rows = await this.all(`
      SELECT 
        p.id,
        p.title,
        p.markdown,
        p.user_id,
        c.id AS comment_id,
        c.message,
        c.user_id AS comment_user_id,
        c.created_at AS comment_created_at
      FROM posts p
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.id = ?
      ORDER BY c.created_at ASC
    `, [id]);

    if (rows.length === 0) return null;

    const post = {
      id: rows[0].id,
      title: rows[0].title,
      markdown: rows[0].markdown,
      user_id: rows[0].user_id,
      comments: []
    };

    for (const row of rows) {
      if (row.comment_id !== null) {
        post.comments.push({
          id: row.comment_id,
          message: row.message,
          user_id: row.comment_user_id,
          created_at: row.comment_created_at
        });
      }
    }

    return post;
  }
}

module.exports = Posts;