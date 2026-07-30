/**
 * Returns `'y'` when the count is exactly **1** (e.g. “entry”) and `'ies'` for all other counts (e.g. “entries”).
 * 
 * This function is useful for creating plural forms of words based on the number provided.
 * For example, it helps in formatting messages that include counts, such as "1 item" vs. "2 items".
 * 
 * @function
 * 
 * @param {number} num - The number to determine if pluralization is needed.
 * 
 * Returns `'y'` when the count is exactly **1** (e.g. “entry”) and `'ies'` for all other counts (e.g. “entries”).
 * 
 * @example
 * 
 * plural(1);
 * // Returns: 'y'
 * 
 * plural(5);
 * // Returns: 'ies'
 */
module.exports = function plural(num) {
  return Number.isInteger(num) && num === 1 ? 'y' : 'ies';
}