/**
 * retry function a given number of times
 * 
 * @param {Function} fn 
 * @param {Number} retries
 *  
 * @returns {Function}
 */
export default async function retry(fn, retries = 3) {
 for (let i = 0; i < retries; i++) {
   try {
     return await fn();
   } catch (e) {
     if (i === retries - 1) console.error(e);
   }
 }
}