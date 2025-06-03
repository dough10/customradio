/**
 * wait an ammout of time
 * @module utils/sleep
 * 
 * @param {ms} milliseconds
 * 
 * @returns {Promise<Void>} Nothing 
 */
export default function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
