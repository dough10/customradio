const fs = require('fs');
const path = require('path');

// Path to your package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Path to your service worker file
const workerFilePath = path.join(__dirname, '..', 'src', 'worker.js');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Extract version number
const version = packageJson.version;

// Read the service worker file
let workerFileContent = fs.readFileSync(workerFilePath, 'utf8');

// Replace placeholder with the actual version number
const newWorkerFileContent = workerFileContent.replace(/CACHE_VERSION = '.*'/, `CACHE_VERSION = '${version}'`);

// Write the updated content back to the service worker file
fs.writeFileSync(workerFilePath, newWorkerFileContent, 'utf8');

console.log(`Updated service worker with CACHE_VERSION = '${version}'`);
