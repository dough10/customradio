const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const changelog = require('../../changelog.json');

function format() {
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
  const changelogText = format();
  res.send(changelogText);
};