const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const changelog = {
  "1.12.1": [
    'Added an Alert system to notify users of changes',
    'Anonymous station play and in list reporting, shifts popular stations to top of search results',
    'Japaneese translations',
    'Korean Translations',
    'Swedish translations',
    'added this changelog'
  ] 
};

function format(req) {
  let formattedText = '';
  for (const version in changelog) {
    formattedText += `${version}:\n\n`;
    changelog[version].forEach(change => {
      formattedText += `  - ${change}\n\n`;
    });
  }
  return formattedText;
}

module.exports = (req, res) => {
  log.info(`${req.ip} -> /changelog.txt ${Date.now() - req.startTime}ms`);
  res.type('text/plain');
  const changelogText = format(req);
  res.send(changelogText);
};