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
const app = express();
const axios = require('axios');


require('dotenv').config();


app.use(compression());
app.use(express.json());
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'html')));


let db;


const DB_HOST = process.env.DB_HOST || 'mongodb://127.0.0.1:27017';


/**
 * An array containing default port numbers used in network protocols.
 * 
 * @constant {string[]} defaultPorts
 * @default
 * @example
 * // Accessing the default ports
 * console.log(defaultPorts[0]); // Output: ':80/'
 * console.log(defaultPorts[1]); // Output: ':443/'
 */
const defaultPorts = [
  ':80/',
  ':443/'
];

/**
 * log string to console with timestamp
 * 
 * @function
 * 
 * @param {String} str
 * 
 * @returns {void} 
 */
function log(str) {
  var now = new Date().toLocaleString();
  console.log(`(${now}) ${str}`);
}

/**
 * return s if value is more or less then 1
 * 
 * @function
 * 
 * @param {Number} num 
 * 
 * @returns {String}
 */
function plural(num) {
  return num === 1 ? '' : 's';
}

/**
 * returns query string if input value has a length
 * 
 * @function
 * 
 * @param {String} value 
 * 
 * @returns {String}
 */
function queryString(value) {
  return (value.length === 0) ? '' : `?genres=${value}`;
}

/**
 * connect to mongodb instance and return the open collection
 * 
 * @function
 * 
 * @param {String} url
 * 
 * @returns {Object}
 */
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

/**
 * test if url is online and collect headers
 * 
 * @function 
 * 
 * @param {String} url 
 * 
 * @returns {Object} object containing result of header check
 * @returns {String} return.url - url tested
 * @returns {String} return.name - name of stream return from header
 * @returns {Boolean} return.isLive - is stream online
 * @returns {String} return.icyGenre - genres playerd on stream
 * @returns {String} return.content -  content-type header
 * @returns {String} return.bitrate - stream bitrate 
 */
async function isLiveStream(url) {
  try {
    defaultPorts.forEach(port => {
      url = url.replace(port, '/');
    });

    if (url.startsWith('http://')) {
      const httpsUrl = url.replace('http://', 'https://');
      const httpsResponse = await axios.head(httpsUrl, {
        timeout: 3000
      });
      if (httpsResponse.status === 200) {
        url = httpsUrl;
        const isLive = httpsResponse.status === 200;
        const name = httpsResponse.headers['icy-name'];
        const icyGenre = httpsResponse.headers['icy-genre'];
        const bitrate = httpsResponse.headers['icy-br'];
        const content = httpsResponse.headers['content-type'];
        return {
          url,
          name,
          isLive,
          icyGenre,
          content,
          bitrate
        };
      }
    }

    const response = await axios.head(url, {
      timeout: 3000
    });
    const isLive = response.status === 200;
    const name = response.headers['icy-name'];
    const icyGenre = response.headers['icy-genre'];
    const bitrate = response.headers['icy-br'];
    const content = response.headers['content-type'];
    return {
      url,
      name,
      isLive,
      icyGenre,
      content,
      bitrate
    };
  } catch (error) {
    return false;
  }
}

/**
 * test streams for online state and headers to identify the stream
 * 
 * @function
 * 
 * @returns {void}
 */
async function testStreams() {
  log('Updating database');
  const stations = await db.find({}).toArray();
  let total = 0;
  for (const station of stations) {
    const stream = await isLiveStream(station.url);
    if (!stream) continue;
    if (stream.bitrate && stream.bitrate.length > 3) stream.bitrate = stream.bitrate.split(',')[0];
    const filter = {
      _id: new ObjectId(station._id)
    };
    const updates = {
      $set: {
        name: stream.name || station.name,
        url: stream.url,
        genre: stream.icyGenre || station.genre,
        online: stream.isLive,
        'content-type': stream.content,
        bitrate: stream.bitrate
      }
    };
    const res = await db.updateOne(filter, updates);
    total += res.modifiedCount;
  }
  log(`Database update complete: ${total} entry${plural(total)} updated`);
}

/**
 * Handles GET requests to the root URL ('/').
 * Logs the IP address of the requester and sends the 'index.html' file as the response.
 * 
 * @function
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @param {express.NextFunction} [next] - The optional next middleware function.
 * 
 * @returns {void}
 * 
 * @example
 * // Example usage:
 * app.get('/', (req, res) => {
 *   log(`${req.ip} -> /`);
 *   res.sendFile(path.join(__dirname, 'html', 'index.html'));
 * });
 */
app.get('/', (req, res) => {
  log(`${req.ip} -> /`);
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

/**
 * Handles GET requests to the '/stations' endpoint.
 * 
 * Validates the query parameter `genres` to ensure it is a string. Fetches and returns a list of radio stations that match the specified genres.
 * 
 * @function
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * 
 * @param {express.Request} req.query - The query parameters of the request.
 * @param {string} req.query.genres - A comma-separated string of genres to filter the radio stations.
 * 
 * @returns {Promise<void>} - A promise that resolves when the response has been sent.
 * 
 * @throws {express.Response} 400 - If the `genres` parameter is not a string or validation fails.
 * @throws {express.Response} 500 - If an error occurs while fetching the stations.
 * 
 * @example
 * // Example request:
 * app.get('/stations?genres=rock,pop', (req, res) => { ... });
 * 
 * // Example response:
 * [
 *   {
 *     "name": "Rock Station",
 *     "url": "http://example.com/rock",
 *     "bitrate": "128kbps"
 *   },
 *   {
 *     "name": "Pop Station",
 *     "url": "http://example.com/pop",
 *     "bitrate": "256kbps"
 *   }
 * ]
 */
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
      bitrate: { $exists: true, $ne: null || 'Quality'}
    }, {
      projection: {
        _id: 0,
        name: 1,
        url: 1,
        bitrate: 1
      }
    }).sort({
      name: 1
    }).toArray();
    log(`${req.ip} -> /stations${queryString(genres.join(','))} ${stations.length} stations returned`);
    res.json(stations);
  } catch (err) {
    console.error('(╬ Ò﹏Ó) Error fetching stations:', err);
    res.status(500).json({
      error: 'Failed to fetch stations (╬ Ò﹏Ó)'
    });
  }
});

/**
 * Handles POST requests to the '/add' endpoint.
 * 
 * Validates the request body to ensure `name` and `url` are provided and valid. 
 * Checks if the station already exists in the database and, if not, adds it. 
 * Returns a success message or an error response.
 * 
 * @function
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * 
 * @param {express.Request} req.body - The body of the request.
 * @param {string} req.body.name - The name of the station. Must be a non-empty string.
 * @param {string} req.body.url - The URL of the station. Must be a valid URL.
 * 
 * @returns {Promise<void>} - A promise that resolves when the response has been sent.
 * 
 * @throws {express.Response} 400 - If validation fails or required fields are missing.
 * @throws {express.Response} 500 - If an error occurs while adding the station to the database.
 * 
 * @example
 * // Example request:
 * app.post('/add', (req, res) => {
 *   // Request body:
 *   // {
 *   //   "name": "Jazz Station",
 *   //   "url": "http://example.com/jazz"
 *   // }
 * });
 * 
 * // Example successful response:
 * {
 *   "message": "station saved o( ❛ᴗ❛ )o"
 * }
 * 
 * // Example response when station already exists:
 * {
 *   "message": "station exists"
 * }
 * 
 * // Example error response:
 * {
 *   "error": "Failed to add station (╬ Ò﹏Ó)"
 * }
 */
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
      return;
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

/**
 * Starts the Express server and sets up necessary initializations.
 * 
 * This function listens on port 3000 and performs the following tasks:
 * 1. Connects to the database using the provided configuration URL.
 * 2. Logs a message indicating that the server is online.
 * 3. Schedules a recurring job to test streams every day at midnight.
 * 
 * @function
 * @param {number} port - The port number on which the server listens.
 * @param {Function} callback - The function to be called once the server starts.
 * 
 * @returns {void}
 * 
 * @example
 * // Starting the server
 * app.listen(3000, async _ => {
 *   db = await connectToDb(config.url);
 *   log('Online. o( ❛ᴗ❛ )o');
 *   schedule.scheduleJob('0 0 * * *', testStreams);
 * });
 */
app.listen(3000, async _ => {
  db = await connectToDb(DB_HOST);
  log('Online. o( ❛ᴗ❛ )o');
  schedule.scheduleJob('0 0 * * *', testStreams);
});