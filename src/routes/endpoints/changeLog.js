const changelog = require('../../../changelog.json');

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
  res.type('text/plain');
  const changelogText = format();
  res.send(changelogText);
};