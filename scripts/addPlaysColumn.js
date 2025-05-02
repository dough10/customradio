const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'customradio.db');
const db = new sqlite3.Database(dbPath);

// Run migrations in series to ensure order
db.serialize(() => {
  // Add playMinutes column
  db.run(`ALTER TABLE stations ADD COLUMN playMinutes INTEGER DEFAULT 0`, (err) => {
    if (err) {
      console.error('Error adding playMinutes column:', err.message);
    } else {
      console.log('Successfully added playMinutes column to stations table');
    }
  });

  // Add inList column
  db.run(`ALTER TABLE stations ADD COLUMN inList INTEGER DEFAULT 0`, (err) => {
    if (err) {
      console.error('Error adding inList column:', err.message);
    } else {
      console.log('Successfully added inList column to stations table');
    }
  });
});

// Close database connection when done
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  }
  console.log('Database connection closed');
});