require('dotenv').config();
const url = require('url');
const log = require('../util/log.js');
const saveToCollection = require('./saveToCollection.js');
const connector = new Connector(process.env.DB_HOST || 'mongodb://127.0.0.1:27017', 'fourohfour');
 

module.exports = async (req, res) => {
  
  let reqadd = {
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  };
  
  log(`${req.ip} requested ${url.format(reqadd)} 404! ╭∩╮(︶︿︶)╭∩╮`);
  
  const data = {
    ...reqadd,
    time: new Date().toLocaleString(),
    ip: req.ip,
    agent: req.headers['user-agent'],
    referer: req.headers.referer
  }
  
  await saveToCollection(data, 'fourohfour');

  res.status(404).json({
    message: '╭∩╮(︶︿︶)╭∩╮'
  });
};