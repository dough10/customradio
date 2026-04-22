const fs = require('fs');
const path = require('path');

function loadSecret(name) {
  const secretPath = path.join('/run/secrets', name);

  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }

  return process.env[name];
}

function injectSecrets(keys) {
  for (const key of keys) {
    const value = loadSecret(key);
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
}

module.exports = { injectSecrets };