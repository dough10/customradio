// Greeting.js
import Base from './DialogBase.js';
import selectors from '../../selectors.js';

export default class GreetingDialog extends Base {
  constructor() {
    super(selectors.greeting);

    if (!this.$dialog) return;

    const greeted = Number(localStorage.getItem("greeted"));
    if (greeted) {
      super.destroy();
      this.$dialog.remove();
      return;
    }

    super.open();

    this.em.add(this.$dialog, 'transitionend', () => {
      if (!this.$dialog.hasAttribute('open')) {
        super.destroy();
        localStorage.setItem("greeted", "1");
        this.$dialog.remove();
      }
    });
  }
}
