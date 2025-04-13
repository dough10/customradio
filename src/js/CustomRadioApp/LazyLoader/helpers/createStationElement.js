import Toast from '../../Toast/Toast.js';
import createSmallButton from './createSmallButton.js';
import debounce from '../../utils/debounce.js';
import contextMenu from './contextMenu.js';
import toggleActiveState from '../../utils/toggleActiveState.js';
import { t } from '../../utils/i18n.js';

const LONG_PRESS_DURATION = 500;

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
 * saves selected stations to localstorage
 * 
 * @param {Array} data - Array of selected stations.
 */
const saveToLocalStorage = debounce((data) => {
  localStorage.setItem('selected', JSON.stringify(data));
}, 1000);

/**
 * toggles selected attribute
 * 
 * @param {Event} ev
 * 
 * @returns {void} 
 */
function toggleSelect(ev) {
  // toggle selected attribute
  const el = ev.target.parentElement;
  el.toggleAttribute('selected');
  
  // get all selected elements
  // update selected count
  const all = Array.from(el.parentNode.querySelectorAll('li[selected]'));
  toggleActiveState(document.querySelector('#download'), all.length);
  
  // store selected stations in localstorage
  el.dataset.bitrate = Number(el.dataset.bitrate);
  const forStorage = all
  .map(el => {return {id: el.id, ...el.dataset}})
  .sort((a, b) => a.name.localeCompare(b.name));
  
  saveToLocalStorage(forStorage);

  // track event
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
  ev.target.blur();
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
      new Toast(t('playing', name), 3);
    } else {
      new Toast(t('playing', name), 3, homepage, t('homepage'));
    }
  } catch (error) {
    const str = t('playingError', error.message);
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
export default function createStationElement({ id, name, url, bitrate, genre, icon, homepage }, player) {
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