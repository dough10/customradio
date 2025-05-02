const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'customradio.db');
const db = new sqlite3.Database(dbPath);

db.run(`ALTER TABLE stations ADD COLUMN plays INTEGER DEFAULT 0`, (err) => {
  if (err) {
    console.error('Error adding plays column:', err.message);
  } else {
    console.log('Successfully added plays column to stations table');
  }
  db.close();
});