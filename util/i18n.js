// i18n.js
const fs = require('fs');
const path = require('path');

const Logger = require('./logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/** @type {Object} an object of language file names & file paths locales[en] = 'path to app folder/locales/en.js' */
const locales = {};

/**
 * load translation files
 */
const localesDir = path.join(__dirname, '..', 'locales');
fs.readdirSync(localesDir).forEach(file => {
  const lang = path.basename(file, '.js');
  locales[lang] = require(path.join(localesDir, file));
});

/** @type {String} current language */
let currentLang = 'en';

/**
 * attempt to set language to users prefrence
 * 
 * @param {String} lang 
 * 
 * @returns {String}
 */
function setLanguage(lang) {
  if (locales[lang]) {
    currentLang = lang;
  } else {
    log.warning(`Language "${lang}" not found. Falling back to 'en'.`);
    currentLang = 'en';
  }
  return currentLang;
}

/**
 * grabs the string or function assigned to input key
 * 
 * @param {String} key 
 * @param  {...any} args 
 * 
 * @returns {String}
 */
function t(key, ...args) {
  const value = locales[currentLang][key];
  return typeof value === 'function' ? value(...args) : value || key;
}

module.exports = { setLanguage, t };

