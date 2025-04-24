/**
 * EventManager class to manage event listeners.
 * It allows adding and removing event listeners easily.
 * 
 * @class
 * @public
 * @example
 * const eventManager = new EventManager();
 * eventManager.add(document, 'click', () => console.log('Clicked!'));
 * eventManager.removeAll(); // Removes all listeners
 */
export default class EventManager {
  constructor() {
    this.listeners = [];
  }

  /**
   * adds an event listener to a target element
   * 
   * @param {HTMLElement} target 
   * @param {String} type 
   * @param {Function} handler 
   * @param {Object} options 
   * 
   * @returns {Number} index of the added listener in the listeners array
   */
  add(target, type, handler, options) {
    if (target) target.addEventListener(type, handler, options);
    this.listeners.push({ target, type, handler, options });
    return this.listeners.length - 1;
  }

  /**
   * Removes a specific event listener by its index.
   * 
   * @param {number} index - The index of the listener to remove.
   * @returns {boolean} - Returns true if the listener was successfully removed, false otherwise.
   */
  remove(index) {
    const listener = this.listeners[index];
    if (listener && listener.target) {
      const { target, type, handler, options } = listener;
      target.removeEventListener(type, handler, options);
      this.listeners.splice(index, 1); // Remove the listener from the array
      return true;
    }
    return false; // Return false if the listener could not be removed
  }

  /**
   * removes all event listeners that were added by this instance
   */
  removeAll() {
    this.listeners.forEach(({ target, type, handler, options }) => {
      if (target) target.removeEventListener(type, handler, options);
    });
    this.listeners = [];
  }
}