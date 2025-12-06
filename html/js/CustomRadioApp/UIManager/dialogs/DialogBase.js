// Base.js
import hapticFeedback from '../../utils/hapticFeedback.js';
import EventManager from '../../EventManager/EventManager.js';
import selectors from '../../selectors.js';

export default class Base {
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
