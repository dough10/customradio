require('dotenv').config();

const {testStreams} = require('./util/testStreams.js');
const scrape = require('./util/scrapeIcecastDirectory.js');

const Connector = require('./util/dbConnector.js');
const connector = new Connector(process.env.DB_HOST, 'stations');

const Stations = require('./util/Stations.js');


// {
//   name: '1950',
//   url: 'https://nl4.mystreaming.net/tt/1950/icecast.audio',
//   genre: 'Unknown',
//   online: true,
//   'content-type': 'audio/mpeg',
//   bitrate: 'Unknown',
//   icon: 'Unknown',
//   homepage: 'Unknown',
//   error: null
// }
async function passToLite(db) { 
  let sql;     
  try {
    sql = new Stations('data/customradio.db');
  } catch(e) {
    console.error(`Failed creating database: ${e.message}`);
    return;
  }             


  const stations = await db.find({}).project({ _id: 0 }).toArray();
  for (const station of stations) {
    if (typeof station.error !== 'string') station.error = '';
    if (typeof station.duplicate !== 'boolean') station.duplicate = false;
    if (typeof station.bitrate !== 'number') station.bitrate = 0;
    if (typeof station.icon !== 'string') station.icon = 'Unknown';
    if (typeof station.homepage !== 'string') station.homepage = 'Unknown';
    try {
      console.log(await sql.addStation(station));
    } catch(e) {
      console.error(`Failed adding station: ${e.message}`);
    }
  }

  // try {
  //   const fromFile = await sql.getAllStations();
  //   const len = fromFile.length;
  //   const ndx = Math.floor(Math.random() * len);

  //   console.log(`total: ${len}`);
  //   console.log(JSON.stringify(stations[ndx]));
  //   console.log(JSON.stringify(fromFile[ndx]));
  // } catch (e) {
  //   console.error(`Failed getting stations from file: ${e.message}`);
  // }

  try {
    const res = await sql.getStationsByGenre(['drum']);
    console.log(res);
    console.log(res.length);
  } catch(e) {
    console.error(`Failed getting stations by genre: ${e.message}`);
  }

  try {
    console.log(await sql.close());
  } catch(e) {
    console.error(`Failed closing database: ${e.message}`);
  }
  
}


async function test() {
  const db = await connector.connect();
  // await testStreams(db);
  // await scrape(db);
  await passToLite(db);
  await connector.disconnect();
}

test();
