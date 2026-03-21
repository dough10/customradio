import EventManager from '../EventManager/EventManager';
import sleep from '../utils/sleep'
import { t } from '../utils/i18n';

const NAMESPACES = {
  alert_click: 'alert-click',
  close_animation: 'close-animation'
};

/**
 * attempts to parse a given string for markdown style links
 * 
 * @param {String} str 
 * 
 * @returns {Object}
 */
function parseLink(str) {
  const pattern = /^\[(https?:\/\/[^\[\]]+)\[([^\[\]]+)\]\]$/;
  const match = str.match(pattern);

  if (!match) return null;

  return {
    url: match[1],
    text: match[2],
  };
}

/**
 * creates and displays an alert element.
 * Automatically appends to document.body and opens it.
 * One-time per `localStorage` key.
 */
export default class Alert {
  constructor(key, title, paragraphs) {
    if (!key || typeof key !== 'string') throw new Error('localstorage key required');
    if (localStorage.getItem(key)) return;
    if (!title || typeof title !== 'string') throw new Error('Title must be a string');
    if (!paragraphs || !Array.isArray(paragraphs)) throw new Error('paragraphs must be an array or strings');
    this._em = new EventManager();
    this.localStorageKey = key;
    this.$alert = this.#createAlert(title, paragraphs);
    document.body.append(this.$alert);
    sleep(20).then(_ => 
      requestAnimationFrame(_ => this.$alert?.setAttribute('open', true))
    );
  }

  /**
   * cleans up listeners and removes alert element
   * 
   * @private
   * 
   * @returns {void}
   */
  #cleanUp() {
    if (this.timeout) clearTimeout(this.timeout);
    this._em.removeByNamespace(NAMESPACES.alert_click);
    this._em.removeByNamespace(NAMESPACES.close_animation);
    this.$alert?.remove();
    this.$alert = null;
    this.timeout = null;
    this._em = null;
    this.localStorageKey = null;
  }

  /**
   * destroys the Alert instance
   * 
   * @private
   * 
   * @returns {void}
   */
  #destroy() {
    if (!this.$alert) return;
    if (this.localStorageKey) localStorage.setItem(this.localStorageKey, 1);
    this._em.add(
      this.$alert,
      this._em.types.transitionend,
      _ => this.#cleanUp(),
      true,
      NAMESPACES.close_animation
    );
    this.timeout = setTimeout(_ => this.#cleanUp(), 500);
    requestAnimationFrame( _ => {
      this.$alert?.removeAttribute('open');
    });
  }

  /**
   * create a paragraph html element with either a link or string of text as contents
   * 
   * @private
   * 
   * @param {String} paragraph 
   * 
   * @returns {HTMLElement}
   */
  #createParagraph(paragraph) {
    if (typeof paragraph !== 'string') return;
    const p = document.createElement('p');
    try {
      const { url, text } = parseLink(paragraph);
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
      const a = document.createElement('a');
      a.href = parsed.toString();
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = text;
      p.append(a);
    } catch {
      p.textContent = paragraph;
    }
    return p;
  }

  /**
   * create a button to dismiss the alert element.
   * 
   * @private
   * 
   * @returns {HTMLElement}
   */
  #createDismissButton() {
    const $dismiss = document.createElement('button');
    $dismiss.classList.add('yellow-text');
    $dismiss.textContent = t('dismiss');
    $dismiss.setAttribute('aria-label', t('dismiss_alert'));
    $dismiss.tabIndex = 0;

    this._em.add(
      $dismiss,
      this._em.types.keydown,
      e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.#destroy();
        }
      },
      true,
      NAMESPACES.alert_click
    );

    this._em.add(
      $dismiss,
      this._em.types.click,
      _ => this.#destroy(),
      true,
      NAMESPACES.alert_click
    );

    return $dismiss;
  }

  /**
   * creates the alert body
   * 
   * @private
   * 
   * @param {String} title 
   * @param {Array} paragraphs
   * 
   * @returns {HTMLElement} - alert body
   */
  #alertTemplate(title, paragraphs) {
    const $h1 = document.createElement('h1');
    $h1.textContent = title;
    
    const body = paragraphs.map(p => this.#createParagraph(p)).filter(Boolean);
    
    const $wrapper = document.createElement('div');
    $wrapper.append($h1, ...body);
    return $wrapper;
  }

  /**
   * creates an alert element
   * 
   * @private
   * 
   * @param {String} title
   * @param {String[]} paragraphs
   * 
   * @returns {HTMLElement}
   */
  #createAlert(title, paragraphs) {
    const $alertBody = this.#alertTemplate(title, paragraphs);
    const $dismiss = this.#createDismissButton();

    const $alert = document.createElement('div');
    $alert.classList.add('alert');
    $alert.append($alertBody, $dismiss);
    $alert.setAttribute('role', 'alert');

    return $alert;
  }
}