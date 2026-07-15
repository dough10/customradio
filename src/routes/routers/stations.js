const express = require('express');
const router = express.Router();

const stations = require('../endpoints/stations.js');
const addToDatabase = require('../endpoints/add.js');
const viewDuplicates = require('../endpoints/viewDuplicates.js');
const update = require('../endpoints/updatedb.js');
const scrape = require('../endpoints/scrape.js');
const markDuplicate = require('../endpoints/markDuplicate.js');
const unmarkDuplicate = require('../endpoints/unmarkDuplicate.js');
const topGenres = require('../endpoints/topGenres.js');
const userStations = require('../endpoints/userStations.js');

const stationsValidator = require('../../schema/stationsValidator.js');
const addStationValidator = require('../../schema/addStationValidator.js');
const markDuplicateValidator = require('../../schema/markDuplicateValidator.js');

/**
 * Handles GET requests to the '/stations' endpoint.
 */
router.get('/', stationsValidator, stations);

/**
 * Handles POST requests to the '/add' endpoint.
 */
router.post('/add', addStationValidator, addToDatabase);

/**
 * Handles GET requests to the '/stations/user' endpoint.
 */
router.get('/user', userStations);

/**
 * Handles the request to retrieve the top genres from the database.
 */
router.get('/topGenres', topGenres);

/** 
 * Endpoint to begin updating the database.
 */
router.get('/update', update);

/**
 * Endpoint to test icecastdb scrape
 */
router.get('/scrape', scrape);

/**
 * view duplicates
 */
router.get('/duplicates', viewDuplicates);

/**
 * endpoint for marking a station as a duplicate
 */
router.post('/duplicates/mark', markDuplicateValidator, markDuplicate);

/**
 * remove duplicate indicator
 */
router.post('/duplicates/unmark', markDuplicateValidator, unmarkDuplicate);


module.exports = router;