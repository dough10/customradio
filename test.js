require('dotenv').config();

const {testStreams} = require('./util/testStreams.js');
const scrape = require('./util/scrapeIcecastDirectory.js');

async function test() {
  await testStreams();
  // await scrape();
}

test();
