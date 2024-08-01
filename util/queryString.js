module.exports = queryString;


/**
 * Generates a query string for the given value.
 * 
 * This function creates a query string in the format `?genres=value` if the provided value is not an empty string.
 * If the value is an empty string, it returns an empty string.
 * 
 * @function
 * 
 * @param {string} value - The value to be included in the query string.
 * 
 * @returns {string} The query string, or an empty string if the value is empty.
 * 
 * @example
 * 
 * queryString('rock');
 * // Returns: '?genres=rock'
 * 
 * queryString('');
 * // Returns: ''
 */
function queryString(value) {
  return (value.length === 0) ? '' : `?genres=${value}`;
}