// DialogBase.js
import hapticFeedback from '../../utils/hapticFeedback.js';
import EventManager from '../../EventManager/EventManager.js';
import selectors from '../../selectors.js';

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
 *     this.em.add(button, 'click', _ => this.open());
 *   }
 * }
 */
export default class DialogBase {
  constructor(selector) {
    this.$dialog = document.querySelector(selector);
    if (!this.$dialog) {
      console.error(`Dialog not found: ${selector}`);
      return;
    }

    this.em = new EventManager();

    this._attachCloseButton();
    this._attachWobbleOnOutsideClick();
  }

  /** 
   * Opens the dialog 
   *
   * @returns {void} 
   */
  open() {
    if (!this.$dialog) return;
    hapticFeedback();
    this.$dialog.showModal();
  }

  /**
   * Closes the dialog
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
   * 
   * @returns {void}
   */
  _attachCloseButton() {
    const btn = this.$(selectors.dialogClose);
    if (!btn) return;
    this.em.add(btn, "click", () => this.close());
  }

  /**
   * Attach wobble animation on outside click
   * 
   * @returns {void}
   */
  _attachWobbleOnOutsideClick() {
    const ns = "wobble";
    this.em.add(this.$dialog, "click", ev => {
      const dialogRect = this.$dialog.getBoundingClientRect();
      const closeButton = this.$(selectors.smallDialogCloseButton);
      const bigCloseButton = this.$(selectors.dialogCloseButton);

      const { clientX, clientY } = ev;

      const inside =
        clientX >= dialogRect.left &&
        clientX <= dialogRect.right &&
        clientY >= dialogRect.top &&
        clientY <= dialogRect.bottom;

      if (inside) return;

      // play wobble animation
      this.$dialog.classList.add("dialog-attention");
      if (closeButton) closeButton.classList.add('attention');
      if (bigCloseButton) bigCloseButton.classList.add('button-attention');

      this.em.add(
        this.$dialog,
        "animationend",
        () => {
          this.$dialog.classList.remove("dialog-attention");
          if (closeButton) closeButton.classList.remove('attention');
          if (bigCloseButton) bigCloseButton.classList.remove('button-attention');
          this.em.removeByNamespace(ns);
        },
        true,
        ns
      );
    });
  }

  /**
   * Query selector within dialog
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
   * 
   * @returns {void}
   */
  destroy() {
    this.em.removeAll();
  }
}
