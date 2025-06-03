const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'html');
const dest = path.join(__dirname, '..', 'public');

// get file lists from src folder
let screenshots = fs.readdirSync(path.join(src, 'screenshots'));

// remove some paths and correct file paths
const files = fs.readdirSync(dest)
  .filter(file => ![
    'worker.js', 
    'screenshots'
  ].includes(file))
  .map(file => `/${file}`);

[
  '/',
  '/stations',
  '/topGenres'
].forEach(endpoint => files.push(endpoint));

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