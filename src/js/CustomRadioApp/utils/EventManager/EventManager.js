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
   * @param {String|null} namespace - Optional namespace for the listener
   * 
   * @returns {Number} index of the added listener in the listeners array
   */
  add(target, type, handler, options, namespace = null) {
    if (!target || typeof type !== 'string' || typeof handler !== 'function') {
      console.warn('Invalid arguments provided to EventManager.add');
      return -1; // Return -1 to indicate failure
    }

    const isDuplicate = this.listeners.some(
      listener =>
        listener.target === target &&
        listener.type === type &&
        listener.handler === handler &&
        JSON.stringify(listener.options) === JSON.stringify(options)
    );
  
    if (isDuplicate) {
      console.warn('Duplicate listener detected');
      return -1;
    }

    target.addEventListener(type, handler, options);
    this.listeners.push({ target, type, handler, options, namespace });
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
      this.listeners.splice(index, 1);
      return listener;
    }
    return null;
  }

  /**
   * Removes all event listeners associated with a specific namespace.
   * 
   * @param {String} namespace - The namespace of the listeners to remove.
   */
  removeByNamespace(namespace) {
    this.listeners = this.listeners.filter(listener => {
      if (listener.namespace === namespace) {
        const { target, type, handler, options } = listener;
        if (target) target.removeEventListener(type, handler, options);
        return false;
      }
      return true;
    });
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