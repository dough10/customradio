const Alerts = require('./../src/model/Alerts.js');
(async () => {
  try {
    const db = new Alerts('data/customradio.db');

    await db.createAlert({
      id: 'Test', 
      title: 'Test', 
      paragraphs: [
        'This is a test alert to see if i am able to insert alerts.',
        'Also what updating looks like.',
        '[https://example.com[Test Link]]'
      ],
      expiresAt: Date.now() + 1000000
    });
    await db.cleanupExpired();
    await db.cleanupOldVersions();
    console.log('done');
  } catch(e) {
    console.error(e);
  }
})();