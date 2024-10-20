const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const workerFilePath = path.join(__dirname, '..', 'src', 'worker.js');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

let workerFileContent = fs.readFileSync(workerFilePath, 'utf8');
const newWorkerFileContent = workerFileContent.replace(
  /CACHE_VERSION = '.*'/,
  `CACHE_VERSION = '${version}'`
);

fs.writeFileSync(workerFilePath, newWorkerFileContent, 'utf8');
console.log(`Updated service worker with CACHE_VERSION = '${version}'`);
