// i18n.js
import { cs } from './lang/cs.js';
import { de } from './lang/de.js';
import { en } from './lang/en.js';
import { es } from './lang/es.js';
import { fi } from './lang/fi.js';
import { fr } from './lang/fr.js';
import { he } from './lang/he.js';
import { hu } from './lang/hu.js';
import { it } from './lang/it.js';
import { ja } from './lang/ja.js';
import { kk } from './lang/kk.js';
import { ko } from './lang/ko.js';
import { nl } from './lang/nl.js';
import { pl } from './lang/pl.js';
import { pt } from './lang/pt.js';
import { ro } from './lang/ro.js';
import { ru } from './lang/ru.js';
import { sk } from './lang/sk.js';
import { sv } from './lang/sv.js';
import { tr } from './lang/tr.js';
import { uk } from './lang/uk.js';
import { vi } from './lang/vi.js';
import { zh } from './lang/zh.js';


const languages = {
  en,
  cs,
  de,
  es,
  fr,
  it,
  nl,
  ja,
  kk,
  ko,
  pl,
  pt,
  ru,
  sk,
  sv,
  tr,
  uk,
  zh,
  fi,
  hu,
  ro,
  vi,
  he
};

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
