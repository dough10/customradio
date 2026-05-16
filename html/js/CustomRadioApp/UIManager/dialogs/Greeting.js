// Greeting.js
import DialogBase from './DialogBase.js';
import selectors from '../../selectors.js';

const key = 'greeted';

/**
 * Greeting Dialog
 * Displays a greeting message to first-time users with instrctions for how to use the site.
 * Closes when the user clicks the close button and the dialog removes itself from the DOM.
 * 
 * @extends {DialogBase}
 */
export default class GreetingDialog extends DialogBase {
  constructor() {
    super(selectors.greeting);

    if (!this.$dialog) return;

    if (Number(localStorage.getItem(key))) {
      this.destroy();
      return;
    }

    this.em.add(this.$dialog, this.em.types.transitionend, _ => this._afterTransition());
    requestAnimationFrame(_ => super.open());
  }

  /**
   * remove the dialog from the DOM
   * 
   * @returns {void}
   */
  _afterTransition() {
    if (this.$dialog.hasAttribute('open')) return;
    this.destroy();
    localStorage.setItem(key, "1");
  }

  destroy() {
    super.destroy();
    this.em.removeAll();
    this.$dialog.remove();
  }
}
