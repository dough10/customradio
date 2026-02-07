// Share.js
import DialogBase from './DialogBase.js';

import Toast from '../../Toast/Toast.js';

import selectors from '../../selectors.js';

import hapticFeedback from '../../utils/hapticFeedback.js';
import txtDownloadUrl from '../../utils/txtDownloadUrl.js';
import {t} from '../../utils/i18n.js';
import sleep from '../../utils/sleep.js';

const SUBMISSION_RESET_TIME = 3000; // ms

const SHARE_TEXT = "My radio.txt download link";

export default class ShareDialog extends DialogBase {
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

    const listeners = [
      { 
        el: this.$trigger, 
        event: "click", 
        handler: () => this.open() 

      }, { 
        el: this.$copy, 
        event: "click", 
        handler: () => this._copy() 

      }, { 
        el: this.$fb, 
        event: "click", 
        handler: () => this._facebook() 

      }, { 
        el: this.$tw, 
        event: "click", 
        handler: () => this._twitter() 

      }, { 
        el: this.$email, 
        event: "click", 
        handler: () => this._email() 

      }, { 
        el: this.$sms, 
        event: "click", 
        handler: () => this._sms() 

      }
    ];

    for (const { el, event, handler } of listeners) {
      this.em.add(el, event, handler);
    }
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
    const searchParams = new URLSearchParams({
      u: this.shareURL
    });
    window.open(
      `https://www.facebook.com/sharer/sharer.php?${searchParams.toString()}`,
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
    const searchParams = new URLSearchParams({
      url: this.shareURL,
      text: SHARE_TEXT
    });

    window.open(
      `https://x.com/intent/post?${searchParams.toString()}`, 
      "_blank", 
      "noopener,noreferrer"
    );
  }

  /**
   * Share via Email
   * 
   * @returns {void}
   */
  _email() {
    hapticFeedback();
    const searchParams = new URLSearchParams({
      subject: SHARE_TEXT,
      body: this.shareURL
    });
    window.open(
      `mailto:?${searchParams.toString()}`,
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
    const searchParams = new URLSearchParams({
      body: this.shareURL
    });
    window.open(
      `sms:?${searchParams.toString()}`, 
      "_blank"
    );
  }
}
