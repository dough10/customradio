/**
 * retry function a given number of times
 * 
 * @param {Function} fn 
 * @param {Number} retries
 *  
 * @returns {Function}
 */
module.exports = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
    }
  }
};