const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src');
const dest = path.join(__dirname, '..', 'public');

// get file lists from destination folder
let files = fs.readdirSync(dest);
let screenshots = fs.readdirSync(path.join(dest, 'screenshots'));

// remove some paths
[
  'worker.js',
  'bundle.min.js.LICENSE.txt',
  'screenshots'
].forEach(file => files.splice(files.indexOf(file),1));

//correct file path strings
files = files.map(file => `/${file}`);
files.push('/');
screenshots = screenshots.map(image => `/screenshots/${image}`);

const urlsToCache = JSON.stringify([...files, ...screenshots]);

// read src file
let workerFileContent = fs.readFileSync(path.join(src, 'worker.js'), 'utf8');

// add paths to file contents
const newWorkerFileContent = workerFileContent.replace(
  /(urlsToCache = )\[[\s\S]*?\];/, 
  `urlsToCache = ${urlsToCache};`
);

// write destination file
fs.writeFileSync(path.join(dest, 'worker.js'), newWorkerFileContent, 'utf8');