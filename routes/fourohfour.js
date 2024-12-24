const url = require('url');
const log = require('../util/log.js');
const saveToCollection = require('../util/saveToCollection.js');

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
    referer: req.headers.referer,
    cookies: req.headers.cookies
  }
  
  await saveToCollection(data, 'fourohfour');

  res.status(404).json({
    message: '╭∩╮(︶︿︶)╭∩╮'
  });
};