const express = require('express');
const router = express.Router();

const downloadtxt = require('../endpoints/downloadtxt.js');
const allStationsTxt = require('../endpoints/allStationsTxt.js');

/**
 * get all online statiosn and generates a txt file download
 */
router.get('/', allStationsTxt);

/**
 * Endpoint to download user stations as a TXT file.
 */
router.get('/:uid', downloadtxt);

module.exports = router;