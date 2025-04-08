/**
 * retry 
 * 
 * @param {String} url 
 * @param {Object} options 
 * @param {Number} retries 
 * 
 * @returns {Object}
 */
export default async function retryFetch(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
    }
  }
}