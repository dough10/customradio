import svgIcon from './createSVGIcon.js';
import sleep from '../../utils/sleep.js';
import Toast from '../../Toast/Toast.js';
import { t } from '../../utils/i18n.js';

const ELEMENT_HEIGHT = 40;

/**
 * Opens a context menu at the click location.
 * 
 * @param {MouseEvent|TouchEvent} ev - The event that triggered the context menu.
 * @returns {Promise<void>}
 */
export default async function contextMenu(ev) {
  const el = ev.target;
  if (!el.dataset.name) return;
  if (ev.type === "contextmenu") ev.preventDefault();
  const buttonData = [
    {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z'
      },
      text: t('markDup'),
      title: t('dupTitle'),
      func:  _ => markDuplicate(el.id)
    }, {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z'
      },
      text : t('homepage'),
      title: t('homepageTitle', el.dataset.homepage),
      func: _ => openStationHomepage(el.dataset.homepage)
    }
  ];
  const body = document.querySelector('body');
  const buttons = buttonData.map(contextMenuItem);
  const popupHeight = ELEMENT_HEIGHT * buttonData.length;
  const X = ev.pageX || ev.touches[0].pageX;
  const Y = ev.pageY || ev.touches[0].pageY;
  const popup = document.createElement('ul');
  const backdrop = document.createElement('div');

  backdrop.classList.add('backdrop');
  popup.classList.add('context-menu');
  popup.append(...buttons);
  placeMenu(popup, X, Y, popupHeight);
  body.append(popup, backdrop);
  await sleep(10);
  popup.addEventListener('transitionend', _ => addPopupListeners(popup, body, backdrop));
  backdrop.toggleAttribute('visable');
  popup.toggleAttribute('open');
}

/**
 * creates a button element for context menu
 * 
 * @param {Object} buttonData - Object containing button details.
 * @param {Object} buttonData.icon - Object containing SVG attributes.
 * @param {String} buttonData.icon.viewbox - The viewBox attribute for the SVG element.
 * @param {String} buttonData.icon.d - The path data for the SVG path element.
 * @param {String} buttonData.text - The text for menu button.
 * @param {String} buttonData.title = the "title" for the button
 * @param {Function} buttonData.func - The function to be called on button click.
 * 
 * @returns {HTMLElement}
 */
function contextMenuItem({icon, text, title, func}) {
  const txt = document.createElement('span');
  txt.textContent = text;
  const li = document.createElement('li');
  li.title = title;
  li.append(svgIcon(icon), txt);
  li.addEventListener('click', _ => func());
  return li;
}

/**
 * opens the stations homepage if present
 * 
 * @param {String} homepage 
 * 
 * @returns {void}
 */
function openStationHomepage(homepage) {
  if (homepage === 'Unknown') {
    new Toast(t('noHome'), 3);
    return;
  }
  
  try {
    if (!(homepage.startsWith('https://') || homepage.startsWith('http://'))) {
      homepage = 'http://' + homepage;
    }
    const url = new URL(homepage);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
    }
    window.open(url.toString());
  } catch(error) {
    new Toast(t('errorHome', error.message));
    console.log(homepage);
    console.error('error validating url:', error);
  }
}

/**
 * add event listeners to dismiss popup element
 * 
 * @param {HTMLElement} popup 
 * @param {HTMLElement} body 
 */
function addPopupListeners(popup, body, backdrop) {
  const dismiss = _ => {
    body.removeEventListener('click', _ => dismiss());
    body.removeEventListener('contextmenu', _ => dismiss());
    popup.addEventListener('transitionend', _ => {
      backdrop.remove();
      popup.remove();
    });
    popup.removeAttribute('open');
    backdrop.removeAttribute('visable');
  };
  popup.addEventListener('mouseleave', _ => dismiss());
  body.addEventListener('click', _ => dismiss());
  body.addEventListener('contextmenu', _ => dismiss());
}

/**
 * sets absolute placement properties of context menu
 * 
 * @param {HTMLElement} menu 
 * @param {Number} X 
 * @param {Number} Y 
 * @param {Number} popupHeight 
 */
function placeMenu(menu, X, Y, popupHeight) {
  const wHeight = window.innerHeight / 2;
  const wWidth = window.innerWidth / 2;
  menu.style.top = `${(Y > wHeight) ? Y - popupHeight : Y}px`;
  menu.style.left = `${(X > wWidth) ? X - 250 : X + 10}px`;
}

/**
 * marks a station as a duplicate in database for manual review
 * 
 * @param {String} id - the station id
 */
async function markDuplicate(id) {
  try {
    const formBody = new URLSearchParams({
      id
    }).toString();
    const response = await fetch('/mark-duplicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });
    const result = await response.json();
    new Toast(result.message, 1.5);
  } catch (err) {
    console.error('error reporting stream duplicate:', err);
  }
} 