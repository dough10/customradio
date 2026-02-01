import EventManager from '../EventManager/EventManager';
import sleep from '../utils/sleep'
import { t } from '../utils/i18n';

/**
 * creates and displays an alert element
 * used to notify user or for content that may need to be interacted with
 */
export default class Alert {

  /**
   * @private 
   * @type {Class} EventManager instance 
   */
  #em = new EventManager();

  constructor(bodyHTML, key) {
    this.key = key;
    this.alert = this.#createAlert(bodyHTML);
    document.querySelector('body').append(this.alert);
    sleep(20).then(_ => requestAnimationFrame(() => this.alert.setAttribute('open', true)));
  }

  /**
   * destroys the Alert instance
   * 
   * @public
   * 
   * @returns {void}
   */
  destroy() {
    if (!this.alert) return;
    if (this.key) localStorage.setItem(this.key, 1);
    this.#em.add(this.alert, 'transitionend', _ => {
      this.#em.removeByNamespace('alert-click');
      this.#em.removeByNamespace('close-animation');
      this.alert.remove();
      this.alert = null;
    }, true, 'close-animation');
    this.alert.removeAttribute('open');
  }

  /**
   * creates an alert element
   * 
   * @private
   * 
   * @param {String} bodyHTML a string of HTML
   * 
   * @returns {HTMLElement}
   */
  #createAlert(bodyHTML) {    
    const dismiss = document.createElement('div');
    dismiss.classList.add('yellow-text');
    dismiss.textContent = t('dismiss');
    dismiss.setAttribute('role', 'button');
    dismiss.setAttribute('aria-label', t('dismiss_alert'));
    this.#em.add(dismiss, 'click', this.destroy.bind(this), true, 'alert-click');

    const alertBody = document.createElement('div');
    alertBody.innerHTML = bodyHTML;

    const alert = document.createElement('div');
    alert.id = 'alert';
    alert.classList.add('alert');
    alert.append(alertBody, dismiss);
    return alert;
  }
}