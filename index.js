const express = require('express');
const {
  query,
  body,
  validationResult
} = require('express-validator');
const compression = require('compression');
const path = require('path');
const {
  MongoClient,
  ObjectId
} = require('mongodb');
const schedule = require('node-schedule');
const config = require('./db.json');
const app = express();
const axios = require('axios');

app.use(compression());
app.use(express.json());
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'html')));


let db;

const defaultPorts = [
  ':80/',
  ':443/'
];


function log(str) {
  var now = new Date().toLocaleString();
  console.log(`(${now}) ${str}`);
}


function plural(num) {
  return num === 1 ? '' : 's';
}


async function connectToDb(url) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    log('Connected to MongoDB');
    const database = client.db('custom-radio');
    return database.collection('stations');
  } catch (err) {
    console.error('(╬ Ò﹏Ó) Error connecting to MongoDB:', err);
    throw err;
  }
}


async function isLiveStream(url) {
  try {
    const response = await axios.head(url, {
      timeout: 3000
    });
    const isLive = response.status === 200;
    const icyGenre = response.headers['icy-genre'];
    const icyDescription = response.headers['icy-description'];
    const bitrate = response.headers['icy-br'];
    const content = response.headers['content-type']
    return {
      isLive,
      icyGenre,
      icyDescription,
      content,
      bitrate
    };
  } catch (error) {
    return false;
  }
}


async function testStreams() {
  log('Running database update');
  const stations = await db.find({}).toArray();
  let total = 0;
  for (const station of stations) {
    defaultPorts.forEach(port => {
      station.url = station.url.replace(port, '/');
    });
    if (stream.bitrate.length > 3) stream.bitrate = stream.bitrate.split(',')[0];
    const stream = await isLiveStream(station.url);
    if (!stream) continue;
    const filter = {
      _id: new ObjectId(station._id)
    }
    const updates = {
      $set: {
        url: station.url,
        genre: stream.icyGenre || station.genre,
        online: stream.isLive,
        'content-type': stream.content,
        bitrate: stream.bitrate
      }
    };
    const res = await db.updateOne(filter, updates);
    total += res.modifiedCount;
  }
  log(`database update complete: ${total} entry${plural(total)} updated`);
}


app.get('/', (req, res) => {
  log(`${req.ip} -> /`);
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});


app.get('/stations', [
  query('genres')
  .trim()
  .escape()
  .isString().withMessage('Genres must be a string'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {
    const genres = req.query.genres.split(',');
    const stations = await db.find({
      'content-type': 'audio/mpeg',
      online: true,
      genre: {
        $in: genres.map(genre => new RegExp(genre, 'i'))
      },
      bitrate: { $exists: true, $ne: null }
    }, {
      projection: {
        _id: 0,
        name: 1,
        url: 1,
        bitrate: 1
      }
    }).sort({
      name: 1
    }).toArray()
    log(`${req.ip} -> /stations?genres=${genres.join(',')}, ${stations.length} stations returned`);
    res.json(stations);
  } catch (err) {
    console.error('(╬ Ò﹏Ó) Error fetching stations:', err);
    res.status(500).json({
      error: 'Failed to fetch stations (╬ Ò﹏Ó)'
    });
  }
});


app.post('/add', [
  body('name').trim().escape().notEmpty().withMessage('Name is required'),
  body('url').trim().isURL().withMessage('Invalid URL')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }
  const {
    name,
    url
  } = req.body;
  log(`${req.ip} -> /add ${name}:${url}`);
  const status = await isLiveStream(url);
  const data = {
    name,
    url,
    online: status.isLive,
    genre: status.genre
  };
  try {
    const exists = await db.findOne({
      url
    });
    if (exists) {
      res.json({
        message: 'station exists'
      });
      return
    }
    await db.insertOne(data);
    res.json({
      message: "station saved o( ❛ᴗ❛ )o"
    });
  } catch (e) {
    res.status(500).json({
      error: 'Failed to add station (╬ Ò﹏Ó)'
    });
  }
});


app.listen(3000, async _ => {
  db = await connectToDb(config.url)
  log('Online. o( ❛ᴗ❛ )o');
  schedule.scheduleJob('0 0 * * *', testStreams);
});