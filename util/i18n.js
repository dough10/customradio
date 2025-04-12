// i18n.js

const Logger = require('./logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const en = require('../locales/en');

const languages = { en };

let currentLang = 'en';

function setLanguage(langCode) {
  if (languages[langCode]) {
    currentLang = langCode;
  } else {
    log.warning(`Language "${langCode}" not found. Falling back to English.`);
    currentLang = 'en';
  }
}

function t(key, ...args) {
  const langPack = languages[currentLang];
  const translation = langPack[key];

  if (typeof translation === 'function') {
    return translation(...args);
  }

  return translation || key;
}

module.exports = {
  setLanguage,
  t,
};
