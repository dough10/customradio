const express = require('express');
const router = express.Router();

const cspReport = require('../endpoints/csp-report.js');
const reportPlay = require('../endpoints/reportPlay.js');
const saveStation = require('../endpoints/saveStation.js');
const streamIssue = require('../endpoints/stream-issue.js');

const userStationValidatior = require('../../schema/userStationValidatior.js');
const cspValidator = require('../../schema/cspValidaton.js');
const streamIssueValidator = require('../../schema/streamIssueValidator.js');

/**
 * An endpoint for audio stream playback error callback
 */
router.post('/stream-issue', streamIssueValidator, streamIssue);

/**
 * endpoint for csp reports
 */
router.post('/csp', cspValidator, cspReport);

/**
 * Reports a playMinute for a station and increments its playMinute count
 * Rate limited to one request per IP address every 5 minutes
 */
router.post('/play/:id', reportPlay);

/**
 * report if station is in a users txt list
 */
router.post('/list/:id', userStationValidatior, saveStation);

module.exports = router;