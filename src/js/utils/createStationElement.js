import Toast from '../Toast/Toast.js'
import { svgIcon } from './createSVGIcon.js';
import { createSmallButton } from './createSmallButton.js';
import sleep from './sleep.js';
import setSelectedCount from './setSelectedCount.js';

const ELEMENT_HEIGHT = 40;
const LONG_PRESS_DURATION = 500;

/**
 * opens the stations homepage if present
 * 
 * @param {String} homepage 
 * 
 * @returns {void}
 */
function openStationHomepage(homepage) {
  if (homepage === 'Unknown') {
    new Toast('No homepage header', 3);
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
    new Toast('Error opening homepage');
    console.log(homepage);
    console.error('error validating url:', error);
  }
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
  
  if (Y > wHeight) {
    menu.style.top = `${Y - popupHeight}px`;
  } else {
    menu.style.top = `${Y}px`;
  }
  if (X > wWidth) {
    menu.style.left = `${X - 250}px`;
  } else {
    menu.style.left = `${X + 10}px`;
  }
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

/**
 * pushes an error to database
 * 
 * @async
 * @function
 * 
 * @param {String} url 
 * @param {Object} error 
 * 
 * @returns {void}
 */
async function postStreamIssue(id, error) {
  try {
    const formBody = new URLSearchParams({
      id,
      error
    }).toString();
    const response = await fetch('/stream-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });
    const result = await response.json();
    console.log(result.message);
  } catch (err) {
    console.error(`Error reporting stream issue for ID ${id}:`, err);
  }
}

/**
 * Opens a context menu at the click location.
 * 
 * @param {MouseEvent|TouchEvent} ev - The event that triggered the context menu.
 * @returns {Promise<void>}
 */
async function contextMenu(ev) {
  if (ev.type === "contextmenu") ev.preventDefault();
  const el = ev.target;
  if (!el.dataset.name) return;
  const buttonData = [
    {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z'
      },
      text: 'mark duplicate',
      title: 'mark station duplicate',
      func:  _ => markDuplicate(el.id)
    }, {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z'
      },
      text : 'homepage',
      title: `navigate to ${el.dataset.homepage}`,
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
 * toggles selected attribute
 * 
 * @param {Event} ev
 * 
 * @returns {void} 
 */
function toggleSelect(ev) {
  const el = ev.target.parentElement;
  el.toggleAttribute('selected');
  const all = Array.from(el.parentNode.querySelectorAll('li[selected]'));
  const forStorage = all.map(el => {return {id: el.id, ...el.dataset}}).sort((a, b) => a.name.localeCompare(b.name));
  localStorage.setItem('selected', JSON.stringify(forStorage));
  setSelectedCount(all.length);
  if (el.hasAttribute('selected')) {
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Add to file', el.dataset.url]);
  } else {
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Remove from file', el.dataset.url]);
  }
}

/**
 * plays stream when button is clicked
 * 
 * reports any playback error to server where it is logged in the database
 * 
 * @async
 * @function
 * 
 * @param {Event} ev
 * @param {Object} player - The audio player instance to control playback.
 * 
 * @returns {void} 
 */
async function playStream(ev, player) {
  ev.preventDefault();

  const el = ev.target.parentElement;
  const id = el.id; 
  const url = el.dataset.url;
  const name = el.dataset.name;
  const bitrate = Number(el.dataset.bitrate);
  const homepage = el.dataset.homepage;
  const stream = { id, url, name, bitrate };

  try {
    player.playStream(stream);
    if (homepage === 'Unknown') {
      new Toast(`Playing ${name}`, 3);
    } else {
      new Toast(`Playing ${name}`, 3, homepage, 'homepage');
    }
  } catch (error) {
    const str = `Error playing media: ${error.message}`;
    new Toast(str, 3);
    console.error(str);
    postStreamIssue(id, error.message);
  }
  if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Play stream', url]);
}

/**
 * creates a list element for a online radio station
 * 
 * @function
 * 
 * @param {Object} station - Object containing station details.
 * @param {String} station.id - The unique identifier for the station.
 * @param {String} station.name - The name of the station.
 * @param {String} station.url - The URL of the station.
 * @param {String} station.bitrate - The bitrate of the station.
 * @param {String} station.genre - the stations return genre header
 * @param {String} station.icon - the station's icon
 * @param {String} station.homepage - the url to the stations homepage
 * @param {Object} player - The audio player instance to control playback.
 * 
 * @returns {HTMLElement} li element
 */
function createStationElement({ id, name, url, bitrate, genre, icon, homepage }, player) {
  const buttonData = [
    {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z'
      },
      cssClass: 'play',
      func: ev => playStream(ev, player),
      title: 'Play stream'
    }, {
      icon: {
        viewbox: '0 0 24 24',
        d: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'
      },
      cssClass: 'add',
      func: toggleSelect,
      title: 'Add to file'
    }, {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M200-440v-80h560v80H200Z'
      },
      cssClass: 'remove',
      func: toggleSelect,
      title: 'Remove from file'
    }
  ];

  if (typeof bitrate !== 'number') bitrate = Number(bitrate);

  let isScrolling = false;
  let pressTimer = 0;

  const buttons = buttonData.map(createSmallButton);

  const span = document.createElement('span');
  span.textContent = name;

  const div = document.createElement('div');
  div.textContent = `${bitrate === 0 ? '???' : bitrate}kbps`;
  div.title = div.textContent;

  const passive = { passive: true };
  const li = document.createElement('li');
  li.id = id;
  li.title = `${name}: ${genre}`;
  li.dataset.name = name;
  li.dataset.url = url;
  li.dataset.bitrate = bitrate;
  li.dataset.genre = genre;
  li.dataset.icon = icon;
  li.dataset.homepage = homepage;

  li.addEventListener('contextmenu', contextMenu);

  li.addEventListener('touchstart', ev => {
    isScrolling = false;
    pressTimer = setTimeout(_ => {
      if (!isScrolling) contextMenu(ev);
    }, LONG_PRESS_DURATION);
  }, passive);

  li.addEventListener('touchend', _ => {
    clearTimeout(pressTimer);
  }, passive);

  li.addEventListener('touchmove', _ => {
    isScrolling = true;
  }, passive);

  li.append(span, div, ...buttons);
  return li;
}

export {createStationElement}