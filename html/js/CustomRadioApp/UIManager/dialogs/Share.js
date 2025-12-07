// Share.js
import Base from './DialogBase.js';

import Toast from '../../Toast/Toast.js';

import selectors from '../../selectors.js';

import hapticFeedback from '../../utils/hapticFeedback.js';
import txtDownloadUrl from '../../utils/txtDownloadUrl.js';
import {t} from '../../utils/i18n.js';
import sleep from '../../utils/sleep.js';

const SUBMISSION_RESET_TIME = 3000; // ms

export default class ShareDialog extends Base {
  constructor() {
    super(selectors.shareDialog);

    this.$trigger = document.querySelector(selectors.sharelink);
    this.$copy = this.$(selectors.copyLink);
    this.$fb = this.$(selectors.fbShare);
    this.$tw = this.$(selectors.twitterShare);
    this.$email = this.$(selectors.emailShare);
    this.$sms = this.$(selectors.smsShare);
    this.$shareMessage = this.$(selectors.shareMessage);

    this.shareURL = txtDownloadUrl();

    const required = [
      this.$trigger,
      this.$copy,
      this.$fb,
      this.$tw,
      this.$email,
      this.$sms,
      this.$shareMessage
    ];

    if (required.some(el => !el)) {
      console.error("ShareDialog initialization failed — missing DOM elements.");
      return;
    }

    this.em.add(this.$trigger, "click", () => this.open());
    this.em.add(this.$copy, "click", () => this._copy());
    this.em.add(this.$fb, "click", () => this._facebook());
    this.em.add(this.$tw, "click", () => this._twitter());
    this.em.add(this.$email, "click", () => this._email());
    this.em.add(this.$sms, "click", () => this._sms());
  }

  /**
   * copy share URL to clipboard
   * 
   * @returns {void}
   */
  async _copy() {
    if (!this.$shareMessage) {
      console.error('Required clipboard elements not found');
      return;
    }
    
    const successMessage = t('clipboard_success');
    const failureMessage = t('clipboard_failure');

    try {
      hapticFeedback();
      await navigator.clipboard.writeText(this.shareURL);
      this.$shareMessage.textContent = successMessage;
      new Toast(successMessage);
    } catch (err) {
      this.$shareMessage.textContent = failureMessage;
      new Toast(failureMessage);
      console.error(err);
    } finally {
      await sleep(SUBMISSION_RESET_TIME);
      this.$shareMessage.textContent = '';
    }
  }

  /**
   * Share on Facebook
   * 
   * @returns {void}
   */
  _facebook() {
    hapticFeedback();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareURL)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /**
   * Share on Twitter
   * 
   * @returns {void}
   */
  _twitter() {
    hapticFeedback();
    const q = new URLSearchParams({
      url: this.shareURL,
      text: "My radio.txt download link:"
    });

    window.open(`https://x.com/intent/post?${q}`, "_blank", "noopener,noreferrer");
  }

  /**
   * Share via Email
   * 
   * @returns {void}
   */
  _email() {
    hapticFeedback();
    window.open(
      `mailto:?subject=My radio.txt link&body=${encodeURIComponent(this.shareURL)}`,
      "_blank"
    );
  }

  /**
   * Share via SMS
   * 
   * @returns {void}
   */
  _sms() {
    hapticFeedback();
    window.open(`sms:?body=${encodeURIComponent(this.shareURL)}`, "_blank");
  }
}
