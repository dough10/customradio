const changelog = require('../../../changelog.json');

function format() {
  return Object.entries(changelog)
    .map(([version, changes]) => {
      return `${version}:\n\n${changes
        .map(change => `  - ${change}\n`)
        .join('\n')}`;
    })
    .join('\n');
}

module.exports = (req, res) => {
  res.type('text/plain');
  const changelogText = format();
  res.send(changelogText);
};