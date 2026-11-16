export default class TimeoutManager {
  #timeouts = new Map();

  /**
   * Schedule a timeout.
   * Replaces an existing timeout with the same key.
   */
  set(key, callback, delay) {
    this.clear(key);

    const id = setTimeout(() => {
      this.#timeouts.delete(key);
      callback();
    }, delay);

    this.#timeouts.set(key, id);

    return id;
  }

  /**
   * Extend an existing timeout.
   * Resets its countdown.
   */
  extend(key, callback, delay) {
    this.set(key, callback, delay);
  }

  /**
   * Clear a specific timeout.
   */
  clear(key) {
    const id = this.#timeouts.get(key);

    if (id === undefined) return;

    clearTimeout(id);
    this.#timeouts.delete(key);
  }

  /**
   * Clear every managed timeout.
   */
  clearAll() {
    for (const id of this.#timeouts.values()) {
      clearTimeout(id);
    }

    this.#timeouts.clear();
  }

  /**
   * Check whether a timeout is currently scheduled.
   */
  has(key) {
    return this.#timeouts.has(key);
  }

  /**
   * Number of active timeouts.
   */
  get size() {
    return this.#timeouts.size;
  }
}
