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
  types = Object.freeze({
    click: 'click',
    change: 'change',
    scroll: 'scroll',
    resize: 'resize',
    input: 'input',
    focus: 'focus',
    blur: 'blur',
    submit: 'submit',
    keydown: 'keydown',
    keyup: 'keyup',
    keypress: 'keypress',
    mouseover: 'mouseover',
    mouseout: 'mouseout',
    mouseenter: 'mouseenter',
    mouseleave: 'mouseleave',
    transitionend: 'transitionend',
    animationend: 'animationend',
    touchstart: 'touchstart',
    touchmove: 'touchmove',
    touchend: 'touchend',
    touchcancel: 'touchcancel',
    online: 'online',
    offline: 'offline',
    error: 'error',
    beforeUnload: 'beforeunload',
    focusin: 'focusin',
    focusout: 'focusout',
    contextmenu: 'contextmenu',
    enterPressed: 'enter-pressed',
  });

  constructor() {
    this.listeners = [];
  }

  /**
   * adds an event listener to a target element
   * 
   * @param {HTMLElement} target 
   * @param {String} type 
   * @param {Function} handler 
   * @param {Object|Boolean} options - Optional options for addEventListener (e.g., { capture: true } or false)
   * @param {String|null} namespace - Optional namespace for the listener
   * 
   * @returns {Number} index of the added listener in the listeners array
   */
  add(target, type, handler, options, namespace = null) {
    if (!target || typeof type !== 'string' || typeof handler !== 'function') {
      console.warn('Invalid arguments provided to EventManager.add');
      console.log('Expected: target (HTMLElement), type (String), handler (Function), options (Object), namespace (String|null)');
      console.log('Received:', { target, type, handler, options, namespace });
      return -1; // Return -1 to indicate failure
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
    if (typeof index !== 'number' || index < 0 || index >= this.listeners.length) {
      console.warn('Invalid index provided to EventManager.remove');
      console.log('Expected: index (Number between 0 and', this.listeners.length - 1, ')');
      console.log('Received:', { index });
      return false;
    }
    const listener = this.listeners[index];
    if (listener && listener.target) {
      const { target, type, handler, options } = listener;
      target.removeEventListener(type, handler, options);
      this.listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Removes all event listeners associated with a specific namespace.
   * 
   * @param {String} namespace - The namespace of the listeners to remove.
   */
  removeByNamespace(namespace) {
    if (typeof namespace !== 'string') {
      console.warn('Invalid namespace provided to EventManager.removeByNamespace');
      console.log('Expected: namespace (String)');
      console.log(`Received: ${namespace} (${typeof namespace})`);
      return;
    }
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