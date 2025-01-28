require('dotenv').config();


const Connector = require('./util/dbConnector.js');
const {testStreams} = require('./util/testStreams.js');
const scrape = require('./util/scrapeIcecastDirectory.js');
const connector = new Connector(process.env.DB_HOST, 'stations');


async function test() {
  const db = await connector.connect();
  // await testStreams(db, true);
  await scrape(db, true);
  await connector.disconnect();
}

test();