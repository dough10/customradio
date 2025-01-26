const fs = require('fs');
const path = require('path');

const htmlFolder = path.join(__dirname, '..', 'public');
const workerFilePath = path.join(htmlFolder, 'worker.js');

let workerFileContent = fs.readFileSync(workerFilePath, 'utf8');
let files = fs.readdirSync(htmlFolder);
let screenshots = fs.readdirSync(path.join(htmlFolder, 'screenshots'));

/**
 * remove things that should not be in the list
 */
[
  'worker.js',
  'bundle.min.js.LICENSE.txt',
  'screenshots'
].forEach(file => files.splice(files.indexOf(file),1));

/**
 * correct file path strings
 */
files = files.map(file => `/${file}`);
screenshots = screenshots.map(image => `/screenshots/${image}`);

const urlsToCache = JSON.stringify([...files, ...screenshots]);

const newWorkerFileContent = workerFileContent.replace(
  /(,urlsToCache=)\[[\s\S]*?\];/, 
  `,urlsToCache=${urlsToCache};`
);
fs.writeFileSync(workerFilePath, newWorkerFileContent, 'utf8');