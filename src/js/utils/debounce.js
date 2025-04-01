/**
 * ensure that a function is only called once
 * 
 * @param {Function} func 
 * @param {Number} delay 
 * 
 * @returns {Function}
 */
export default function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}