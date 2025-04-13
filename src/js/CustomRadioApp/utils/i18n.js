// i18n.js
import { en } from './lang/en.js';
import { es } from './lang/es.js';

const languages = { en, es };

let currentLang = 'en';

/**
 * sets the perfered language
 * 
 * @param {String} lang 
 */
export function setLanguage(lang) {
  if (languages[lang]) {
    currentLang = lang;
  } else {
    console.warn(`Language ${lang} not found, defaulting to "en".`);
    currentLang = 'en';
  }
}

/**
 * lookup translation key
 * 
 * @param {String} key 
 * @param  {...any} args 
 * 
 * @returns {String} translated string
 */
export function t(key, ...args) {
  const translation = languages[currentLang][key];
  if (typeof translation === 'function') {
    return translation(...args);
  }
  return translation || key;
}
