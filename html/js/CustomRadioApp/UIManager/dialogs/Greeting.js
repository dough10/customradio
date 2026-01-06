// Greeting.js
import DialogBase from './DialogBase.js';
import selectors from '../../selectors.js';

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

    const greeted = Number(localStorage.getItem("greeted"));
    if (greeted) {
      super.destroy();
      this.$dialog.remove();
      return;
    }

    this.em.add(this.$dialog, 'transitionend', _ => this._afterTransition());
    requestAnimationFrame(_ => super.open());
  }

  /**
   * remove the dialog from the DOM
   * 
   * @returns {void}
   */
  _afterTransition() {
    if (!this.$dialog.hasAttribute('open')) {
      this.destroy();
      localStorage.setItem("greeted", "1");
      this.$dialog.remove();
    }
  }
}
