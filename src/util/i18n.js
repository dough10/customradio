// i18n.js
const path = require('path');

const {logger} = require('./../services.js');

/** @type {Object} an object of language file names & file paths locales[en] = 'path to app folder/locales/en.js' */
const locales = {};

/**
 * load translation files
 */
const context = require.context('../locales', false, /\.js$/);
context.keys().forEach(file => {
  const lang = path.basename(file, '.js');
  locales[lang] = context(file);
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
function setLanguage(langHeader) {
  // Default fallback
  const fallback = 'en';

  if (typeof langHeader !== 'string' || !langHeader.trim()) {
    currentLang = fallback;
    return currentLang;
  }

  // Split multiple languages: "en-US,en;q=0.9,fr;q=0.8"
  const candidates = langHeader.split(',');

  for (let candidate of candidates) {
    // Remove quality values and normalize
    let lang = candidate.split(';')[0].trim().toLowerCase();

    if (!lang) continue;

    // Exact match
    if (locales[lang]) {
      currentLang = lang;
      return currentLang;
    }

    // Fallback to base language (e.g., "en-us" → "en")
    const baseLang = lang.split('-')[0];
    if (locales[baseLang]) {
      currentLang = baseLang;
      return currentLang;
    }
  }

  // Log only once using first candidate for clarity
  const firstLang = candidates[0]?.split(';')[0].trim().toLowerCase();
  if (firstLang && !locales[firstLang]) {
    logger.warning(`language file does not exist: ${firstLang}`);
  }

  currentLang = fallback;
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

