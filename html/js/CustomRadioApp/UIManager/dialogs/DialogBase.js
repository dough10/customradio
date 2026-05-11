// DialogBase.js
import hapticFeedback from '../../utils/hapticFeedback.js';
import EventManager from '../../EventManager/EventManager.js';
import selectors from '../../selectors.js';

const NAMESPACES = {
  close: 'close',
  wobble: 'wobble'
};

/**
 * Base class for dialogs. Handles common functionality like open/close,
 * close button, and outside click wobble animation.
 * 
 * @class DialogBase
 * 
 * @author James Doughten
 * @version 1.0.0
 * 
 * @requires ../../utils/hapticFeedback.js
 * @requires ../../EventManager/EventManager.js
 * @requires ../../selectors.js
 * 
 * @returns {void}
 * 
 * @param {String} selector - The dialog selector
 * 
 * @property {Element|null} $dialog - The dialog element
 * @property {EventManager} em - The event manager for handling events
 * 
 * @method open - Opens the dialog
 * @method close - Closes the dialog
 * @method destroy - Destroys the dialog and its event listeners
 * @method $ - Query selector within dialog
 * 
 * @example
 * import DialogBase from './DialogBase.js';
 * export default class MyDialog extends DialogBase {
 *   constructor() {
 *     // Call the parent constructor with the dialog selector
 *     super('#my-dialog');
 *     console.log(this.$dialog); // Access the dialog element
 * 
 *     // Attach additional event listeners or initialization here
 *     const button = document.querySelector('.my-button');
 *     if (button) this.em.add(button, 'click', _ => this.open());
 *   }
 * }
 */
export default class DialogBase {
  constructor(selector) {
    this.$dialog = document.querySelector(selector);
    if (!this.$dialog) {
      throw new Error(`Dialog not found: ${selector}`);
    }

    this.em = new EventManager();

    this._attachCloseButton();
    this._attachWobbleOnOutsideClick();
  }

  /** 
   * Opens the dialog
   * @public
   *
   * @returns {void} 
   */
  open() {
    if (!this.$dialog) return;
    hapticFeedback();
    try {
      this.$dialog.showModal();
    } catch {
      this.$dialog.setAttribute("open", "");
    }
  }

  /**
   * Closes the dialog
   * @public
   * 
   * @returns {void}
   */
  close() {
    if (!this.$dialog) return;
    hapticFeedback();
    this.$dialog.close();
  }

  /**
   * Attach close button listener
   * @private
   * 
   * @returns {void}
   */
  _attachCloseButton() {
    const btn = this.$(selectors.dialogClose);
    if (!btn) return;
    this.em.add(btn, this.em.types.click, () => this.close(), null, NAMESPACES.close);
  }

  /**
   * Plays the dialog animation
   * 
   * @param {Event} ev 
   * @returns {Void}
   */
  _wobble(ev) {
    const ns = `${NAMESPACES.wobble}-${Date.now()}`;
    const closeButton = this.$(selectors.smallDialogCloseButton);
    const bigCloseButton = this.$(selectors.dialogCloseButton);
    const { left, right, top, bottom } = this.$dialog.getBoundingClientRect();
    const { clientX: x, clientY: y } = ev;

    const inside = x >= left && x <= right && y >= top && y <= bottom;

    if (inside) return;

    const callback = () => {
      this.$dialog.classList.remove("dialog-attention");
      if (closeButton) closeButton.classList.remove('attention');
      if (bigCloseButton) bigCloseButton.classList.remove('button-attention');
      this.em.removeByNamespace(ns);
    };

    this.em.add(this.$dialog, this.em.types.animationend, callback, null, ns);
    // play wobble animation
    this.$dialog.classList.add("dialog-attention");
    if (closeButton) closeButton.classList.add('attention');
    if (bigCloseButton) bigCloseButton.classList.add('button-attention');
  }

  /**
   * Attach wobble animation on outside click
   * @private
   * 
   * @returns {void}
   */
  _attachWobbleOnOutsideClick() {
    this.em.add(this.$dialog, this.em.types.click, ev => this._wobble(ev), null, NAMESPACES.wobble);
  }

  /**
   * Query selector within dialog
   * @public
   * 
   * @param {String} sel - The selector
   * 
   * @returns {Element|null} The found element or null
   */
  $(sel) {
    return this.$dialog ? this.$dialog.querySelector(sel) : null;
  }

  /**
   * Destroy the dialog and its event listeners
   * @public
   * 
   * @returns {void}
   */
  destroy() {
    Object.values(NAMESPACES).forEach(ns => this.em.removeByNamespace(ns));
    this.em.removeAll();
  }
}
