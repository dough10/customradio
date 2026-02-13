/**
 * Normalizes input string to improve fuzzy search matching, including URLs.
 * 
 * @param {String} str
 * @returns {String}
 */
export default function normalizeInput(str) {
  try {
    new URL(str);
    return str;
  } catch {
    return str
      .toLowerCase()
      .replace(/&|\band\b|(?:'n'|n')(?=\s|$|\W)/g, ' and ') // Normalize 'n' and '&' to 'and'
      .normalize("NFD").replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/\/+/g, '/') // Normalize multiple slashes to a single slash
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .replace(/#.*$/, '') // Remove URL fragments
      .replace(/[^a-z0-9\s.\/?&=]/gi, '') // Remove non-alphanumeric characters except spaces, slashes, periods, query characters
      .split(/\s+/)
      .filter(Boolean)
      .join(' ');
  }
}
