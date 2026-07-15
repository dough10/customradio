const express = require('express');
const router = express.Router();

const getAlerts = require('../endpoints/getAlerts.js');
const addAlert = require('../endpoints/addAlert.js');
const submitAlert = require('../endpoints/submitAlert.js');
const dismissAlert = require('../endpoints/dismissAlert.js');

const alertValidator = require('../../schema/alertValidator.js');
const dismissValidator = require('../../schema/dismissValidator.js');


/**
 * gets all currently active alerts
*/
router.get('/', getAlerts);

/**
 * page to submit alerts
 */
router.get('/add', submitAlert);

/**
 * creates a alert  in the database
 */
router.post('/add', alertValidator, addAlert);

/**
 * dismiss an alert using id and version
*/
router.post('/dismiss', dismissValidator, dismissAlert);

module.exports = router;