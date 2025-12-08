// Info.js
import DialogBase from './DialogBase.js';

import Toast from '../../Toast/Toast.js';

import selectors from '../../selectors.js';

import loadingAnimation from '../helpers/insertLoadingAnimation.js';

import hapticFeedback from '../../utils/hapticFeedback.js';
import retry from '../../utils/retry.js';

export default class InfoDialog extends DialogBase {
  constructor() {
    super(selectors.infoDialog);

    this.$trigger = document.querySelector(selectors.infoButton);

    if (!this.$dialog || !this.$trigger) return;

    this.em.add(this.$trigger, "click", () => this.open());
  }

  async open() {
    super.open();
    await this._loadContent();
  }

  /**
   * populate info dialog with details about application
   * 
   * @returns {void}
   */
  async _loadContent() {
    const depDiv = this.$(selectors.dependencies);
    const changelog = this.$(selectors.changelog);

    hapticFeedback();

    if (depDiv.querySelectorAll('*').length > 5) return;

    loadingAnimation(depDiv);

    try {
      const response = await retry(_ => fetch('/info'));
      const pack = await response.json();

      this.$('h1').textContent = `v${pack.version}`;
      
      const changes = this._createChangelog(pack.changelog);
      changelog.append(changes);

      const dependencies = this._createList(pack.dependencies);
      depDiv.append(dependencies);
    } catch (error) {
      const message = `Error fetching dependencies: ${error.message}`;
      console.error(message);
      new Toast(message, 3);
    } finally {
      depDiv.querySelector(selectors.loading)?.remove();
    }
  }

  /**
   * removes ^ if it is the first char in a string
   * 
   * @param {String} str
   *  
   * @returns {String} string without ^
   */
  _rmArrow(str) {
    if (str.charAt(0) === "^") {
      return str.slice(1);
    }
    return str;
  }

  /**
   * creates html elements for most recent 3 versions of changelog
   * 
   * @param {Object} changes - changelog object from backend
   * 
   * @returns {HTMLElement} document fragment containing HTMLElements
   */
  _createChangelog(changes) {
    const fragment = document.createDocumentFragment();
    let count = 0;
    
    for (const version in changes) {
      if (count++ >= 3) break;

      const header = document.createElement('h3');
      header.textContent = `${version}:`;

      const list = document.createElement('ul');
      
      const items = changes[version].map(change => {
        const li = document.createElement('li');
        li.textContent = change.replace(/\s*\(.*?\)\s*/g, ' ').trim();
        return li;
      });
      
      list.append(...items);
      fragment.append(header, list);
    }
    
    return fragment;
  }

  /**
   * creates html elements for application dependencies 
   * 
   * @param {Array} entrys
   *  
   * @returns {HTMLElement}
   */
  _createList(entrys) {
    const fragment = document.createDocumentFragment();
    
    const items = Object.entries(entrys).map(([key, value]) => {
      const li = document.createElement('li');
      li.textContent = `${key}: ${this._rmArrow(value)}`;
      return li;
    });
    
    fragment.append(...items);
    return fragment;
  }
}
