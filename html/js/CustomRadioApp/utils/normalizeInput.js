/**
 * Normalizes input string to improve fuzzy search matching, including URLs.
 * 
 * @param {String} str
 * @returns {String}
 */
export default function normalizeInput(str) {
  try {
    const url = new URL(str); // Try parsing the input as a URL
    let hostname = url.hostname;

    // Remove "www." if present
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Normalize pathname (replace hyphens with spaces)
    let pathname = url.pathname ? url.pathname.replace(/-/g, ' ') : '';

    // Return the normalized URL (hostname + pathname + search/query)
    return hostname + pathname + (url.search ? url.search : '');
  } catch {
    // If not a valid URL, perform the usual normalization
    return str
      .toLowerCase()
      .replace(/&|\band\b|(?:\bn\b|'n'|n'|n)(?=\s|$|\W)/g, ' and ') // Normalize 'n' and '&' to 'and'
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
