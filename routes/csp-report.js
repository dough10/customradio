const {validationResult} = require('express-validator');

const Connector = require('../util/dbConnector.js');
const log = require('../util/log.js');

const connector = new Connector(process.env.DB_HOST, 'csp-report');

module.exports = async (req, res) => {
  try {
    const cspReport = req.body;
    const db = await connector.connect();
    cspReport.time = new Date().getTime();
    log('CSP Report Received:', cspReport['csp-report']);
    db.insertOne(cspReport);
    await connector.disconnect();
    res.status(204).send();
  } catch(error) {
    console.error('Error Saving CSP-Report:', error.message);
    return; 
  }
};