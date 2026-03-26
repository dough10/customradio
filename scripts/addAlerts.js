const Alerts = require('./../src/model/Alerts.js');
const readline = require('readline');

const db = new Alerts('data/customradio.db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to use question with await
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

(async () => {
  try {
    // Get alert ID
    let id = '';
    while (!id.trim()) {
      id = await question('Alert ID: ');
      if (!id.trim()) console.log('Alert ID cannot be empty. Please enter a value.');
    }

    // Get title
    let title = '';
    while (!title.trim()) {
      title = await question('Title: ');
      if (!title.trim()) console.log('Title cannot be empty. Please enter a value.');
    }

    // Get paragraphs (empty line to stop)
    console.log('Enter paragraphs (press Enter on empty line to finish):');
    const paragraphs = [];
    while (true) {
      const p = await question('> ');
      if (!p.trim()) break; // Stop on empty line
      paragraphs.push(p);
    }

    if (paragraphs.length === 0) {
      console.log('No paragraphs entered. Exiting.');
      rl.close();
      return;
    }

    // Create alert
    await db.createAlert({
      id,
      title,
      paragraphs
    });

    await db.cleanupExpired();
    await db.cleanupOldVersions();
    console.log('✅ Alert successfully added!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    rl.close();
  }
})();