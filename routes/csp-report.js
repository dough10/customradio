const {validationResult} = require('express-validator');

const Connector = require('../util/dbConnector.js');
const log = require('../util/log.js');

const connector = new Connector(process.env.DB_HOST, 'csp-report');

module.exports = async (req, res) => {
  try {
    const db = await connector.connect();
    const cspReport = req.body;
    log('CSP Report Received:', cspReport['csp-report']);
    cspReport.time = new Date().getTime();
    db.insertOne(cspReport);
    await connector.disconnect();
    res.status(204).send();
  } catch(error) {
    console.error('Error Saving CSP-Report:', error.message);
    return; 
  }
};