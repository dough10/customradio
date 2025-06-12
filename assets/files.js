const fs = require('fs');
const path = require('path');

function getJsFiles(dir) {
  let results = [];

  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getJsFiles(filePath)); // recurse into subfolder
    } else if (
      file.endsWith('.js') &&
      !file.endsWith('.test.js')
    ) {
      results.push(filePath); // full path, or use `file` for just the name
    }
  });

  return results;
}

module.exports = () => {
  const srcPath = path.join(__dirname, '..', 'src');
  return getJsFiles(srcPath);
};
