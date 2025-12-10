// Greeting.js
import DialogBase from './DialogBase.js';
import selectors from '../../selectors.js';

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

    
    this.em.add(this.$dialog, 'transitionend', () => this._afterTransition());
    requestAnimationFrame(super.open);
  }

  /**
   * remove the dialog from the DOM
   * 
   * @returns {void}
   */
  _afterTransition() {
    if (!this.$dialog.hasAttribute('open')) {
      super.destroy();
      localStorage.setItem("greeted", "1");
      this.$dialog.remove();
    }
  }
}
