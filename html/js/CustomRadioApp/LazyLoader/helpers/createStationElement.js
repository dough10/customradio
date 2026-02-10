import EventManager from '../../EventManager/EventManager.js';

import Toast from '../../Toast/Toast.js';
import createSmallButton from './createSmallButton.js';
import contextMenu from './contextMenu.js';
import toggleActiveState from '../../utils/toggleActiveState.js';
import { t } from '../../utils/i18n.js';
import hapticFeedback from '../../utils/hapticFeedback.js';
import selectors from '../../selectors.js';
import _OPTIONS from '../../utils/post_options.js';
import updateCsrf from '../../utils/updateCsrf.js';
import retry from '../../utils/retry.js';
import sleep from '../../utils/sleep.js';

const LONG_PRESS_DURATION = 500;

const em = new EventManager();

async function csrf(res) {
  if (![403, 419, 440].includes(res?.status)) return false;
  return await updateCsrf();
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
async function postStreamIssue(id, error, attempts = 3) {
  try {
    const url = new URL('/stream-issue', window.location.origin);
    const response = await retry(_ => fetch(url.toString(), _OPTIONS({
      id,
      error
    })));
    const result = await response.json();
    console.log(result.message);
    if (!await csrf(result) || attempts === 0) return;
    postStreamIssue(id, error, attempts - 1);
  } catch (err) {
    console.error(`Error reporting stream issue for ID ${id}:`, err);
  }
}

/**
 * reports station in user list state
 * 
 * @param {String} id 
 * @param {Number} state 
 * 
 * @returns {void}
 */
async function reportInList(id, state, attempts = 1) {
  try {
    const url = new URL(`/reportInList/${id}`, window.location.origin);
    url.searchParams.append('state', state ? '1' : '0');
    const res = await retry(_ => fetch(url.toString(), _OPTIONS()));
    if (!await csrf(res) || attempts === 0) return;
    reportInList(id, state, attempts - 1);
  } catch(e) {
    console.error(e);
  }
}

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
  el.dataset.bitrate = Number(el.dataset.bitrate);
  
  hapticFeedback();

  // get all selected elements
  const all = Array.from(el.parentNode.querySelectorAll(selectors.selectedStation));

  // show / hide download button
  toggleActiveState(document.querySelector(selectors.downloadButton), all.length);

  const selected = el.hasAttribute('selected');
  reportInList(el.id, selected);
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

  hapticFeedback();

  const el = ev.target.parentElement;
  const id = el.id; 
  const url = el.dataset.url;
  const name = el.dataset.name;
  const bitrate = Number(el.dataset.bitrate);
  const homepage = el.dataset.homepage;
  const stream = { id, url, name, bitrate };

  try {
    player.playStream(stream);
    const playing = t('playing', name);
    await sleep(500);
    (homepage === 'Unknown') ? new Toast(playing, 3) : new Toast(playing, 3, homepage, t('homepage'));
  } catch (error) {
    const str = t('playingError', error.message);
    await sleep(500);
    new Toast(str, 3);
    console.error(str);
    postStreamIssue(id, error.message);
  }
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
      title: t('playTitle')
    }, {
      icon: {
        viewbox: '0 0 24 24',
        d: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'
      },
      cssClass: 'add',
      func: toggleSelect,
      title: t('addTitle')
    }, {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M200-440v-80h560v80H200Z'
      },
      cssClass: 'remove',
      func: toggleSelect,
      title: t('removeTitle')
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
  try {
    li.dataset.url = new URL(url).toString();
  }
  catch (e) {
    console.error(`Invalid URL for station ${id}: ${url}`);
    return;
  }
  li.dataset.bitrate = bitrate;
  li.dataset.genre = genre;
  li.dataset.icon = icon;
  li.dataset.homepage = homepage;

  em.add(li, 'contextmenu', contextMenu);

  em.add(li, 'touchstart', ev => {
    isScrolling = false;
    pressTimer = setTimeout(_ => {
      if (!isScrolling) contextMenu(ev);
    }, LONG_PRESS_DURATION);
  }, passive);

  em.add(li, 'touchend', _ => {
    clearTimeout(pressTimer);
  }, passive);
  
  em.add(li, 'touchmove', _ => {
    isScrolling = true;
  }, passive);

  li.append(span, div, ...buttons);
  return li;
}