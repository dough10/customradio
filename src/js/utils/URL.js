/**
 * Validates if a given string is a valid URL
 * 
 * @param {String} url - URL string
 * @returns {Boolean} true if valid URL, false otherwise
 */
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export { isValidURL };