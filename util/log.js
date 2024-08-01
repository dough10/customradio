module.exports = log;


/**
 * Logs a message to the console with a timestamp.
 * 
 * This function prepends a timestamp (in the local date and time format) to the provided message
 * and logs the resulting string to the console.
 * 
 * @function
 * 
 * @param {string} str - The message to be logged to the console.
 * 
 * @returns {void}
 * 
 * @example
 * 
 * log('This is a log message');
 * // Output: (MM/DD/YYYY, HH:MM:SS AM/PM) This is a log message
 */
function log(str) {
  var now = new Date().toLocaleString();
  console.log(`(${now}) ${str}`);
}