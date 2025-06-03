/**
 * Normalizes input string to improve fuzzy search matching.
 * 
 * @param {String} str
 * @returns {String}
 */
export default function normalizeInput(str) {
  return str
    .toLowerCase()
    .replace(/&|\band\b|(?:\bn\b|'n'|n'|'n)(?=\s|$|\W)/g, ' and ')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\/\\]/g, ' ')
    .replace(/[^a-z0-9\s]/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}
