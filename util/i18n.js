// i18n.js
const fs = require('fs');
const path = require('path');

const Logger = require('./logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const locales = {};
const localesDir = path.join(__dirname, '..', 'locales');

fs.readdirSync(localesDir).forEach(file => {
  const lang = path.basename(file, '.js');
  locales[lang] = require(path.join(localesDir, file));
});

let currentLang = 'en';

function setLanguage(lang) {
  if (locales[lang]) {
    currentLang = lang;
  } else {
    log.warning(`Language "${lang}" not found. Falling back to 'en'.`);
    currentLang = 'en';
  }
  return currentLang;
}

function t(key, ...args) {
  const value = locales[currentLang][key];
  return typeof value === 'function' ? value(...args) : value || key;
}

module.exports = { setLanguage, t };

