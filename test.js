require('dotenv').config();

const Connector = require('./util/dbConnector.js');

const connector = new Connector(process.env.DB_HOST, 'stations');

function isIPv4(address) {
  const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Pattern.test(address);
}

function urlDeconstruction(URL) {
  const parsedUrl = url.parse(URL);

  const splitHostname = parsedUrl.hostname.split('.');
  let subdomain;
  let domain;
  let ext;
  let ip;

  if (isIPv4(parsedUrl.hostname)) {
    ip = parsedUrl.hostname;
  } else if (splitHostname.length > 2) {
    subdomain = splitHostname[0];
    domain = splitHostname[1];
    ext = splitHostname[2];
  } else {
    domain = splitHostname[0];
    ext = splitHostname[1];
  }

  return {
    protocol: parsedUrl.protocol,
    slashes: parsedUrl.slashes,
    ip,
    subdomain,
    domain,
    ext,
    port: parsedUrl.port,
    hash: parsedUrl.hash,
    search: parsedUrl.search,
    query: parsedUrl.query,
    pathname: parsedUrl.pathname
  };

}

async function parseGernes() {
  const db = await connector.connect();
  const allGenres = await db.aggregate([
    {
      $project: {
        genre: { $toLower: "$genre" }
      }
    },
    {
      $group: {
        _id: "$genre"
      }
    },
    {
      $project: {
        _id: 0,
        genre: "$_id"
      }
    }
  ]).toArray();
  await connector.disconnect();

  const genreList = allGenres.flatMap(obj => obj.genre.split(',')).sort((a,b) => a.localeCompare(b));
  const set = new Set();
  genreList.forEach(genre => {
    if (genre) set.add(genre.trim().replace(/"/g, '').replace(/'/g, ''));
  });
  console.log(set);
}

async function duplicate_url() {
  const db = await connector.connect();

  await connector.disconnect();
}

parseGernes();