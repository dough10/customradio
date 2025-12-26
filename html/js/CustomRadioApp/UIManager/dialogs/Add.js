// Add.js
import DialogBase from './DialogBase.js';

import Toast from '../../Toast/Toast.js';

import selectors from '../../selectors.js';

import isValidURL from '../../utils/URL.js';
import updateCsrf from '../../utils/updateCsrf.js';
import _OPTIONS from '../../utils/post_options.js';
import retry from '../../utils/retry.js';
import sleep from '../../utils/sleep.js';

const SUBMISSION_RESET = 2000;

export default class AddStreamDialog extends DialogBase {
  constructor() {
    super(selectors.addDialog);

    this.$trigger = document.querySelector(selectors.add);
    this.$form = this.$(selectors.stationSubmitForm);
    this.$input = this.$(selectors.stationUrl);
    this.$submit = this.$(selectors.stationSubmit);
    this.$response = this.$(selectors.response);

    if (!this.$dialog || !this.$trigger || !this.$form || !this.$input) return;

    this.em.add(this.$trigger, "click", () => this.open());
    this.em.add(this.$input, "input", () => this._validate());
    this.em.add(this.$form, "submit", ev => this._submit(ev));
  }

  /**
   * Validate the input URL
   * 
   * @returns {void}
   */
  _validate() {
    const valid = isValidURL(this.$input.value);
    if (valid) this.$submit.removeAttribute("disabled");
    else this.$submit.setAttribute("disabled", true);
  }

  /**
   * Submit the add stream form
   * 
   * @param {Event} ev 
   * @param {Number} retryCount 
   * 
   * @returns {Promise<void>}
   */
  async _submit(ev, retryCount = 0) {
    ev.preventDefault();

    try {
      const url = new URL(this.$input.value).toString();
      this.$submit.setAttribute("disabled", true);

      const opts = _OPTIONS({ url });
      const res = await retry(() => fetch("/add", opts));
      
      if ([403,419,440].includes(res.status)) {
        if (retryCount < 1) {
          const ok = await updateCsrf();
          if (ok) return this._submit(ev, retryCount + 1);
        }
        this.$response.textContent = "Authentication error.";
        return;
      }

      const data = await res.json();
      const msg = data.message;

      this.$response.textContent = msg;
      new Toast(msg);

    } catch (err) {
      new Toast("An error occurred");
      console.error(err);
    } finally {
      await sleep(SUBMISSION_RESET);
      this.$input.value = "";
      this.$response.textContent = "";
    }
  }
}
