import EventManager from '../../EventManager/EventManager.js';
import Toast from '../../Toast/Toast.js';
import DupDialog from '../dialogs/DupDialog.js';

import selectors from '../../selectors.js';

import raf from '../../utils/raf.js';
import sleep from '../../utils/sleep.js';
import txtDownloadUrl from '../../utils/txtDownloadUrl.js';
import { qs } from '../../utils/querySelectors.js';

const em = new EventManager();

const $userMenuButton = qs(selectors.userMenuButton);

const $userMenu = qs(selectors.userMenu);

const $loginButton = qs(selectors.login);
const $logoutButton = qs(selectors.logout);
const $signupButton = qs(selectors.signup);
const $addAlertBtn = qs(selectors.addAlertBtn);
const $dupButton = qs(selectors.dupButton);
const $updateButton = qs(selectors.updateButton);
const $scrape = qs(selectors.scrape);

const $sharelink = qs(selectors.sharelink);
const $dashboardLink = qs(selectors.dashboard);

const required = [
  $userMenu,
  $userMenuButton,
];

if (required.some(el => !el)) {
  throw new Error("Initialization failed — missing Menu DOM elements.");
}

const NAMESPACE = {
  backdropClick: 'backdrop-click',
  menuButton: 'menu-button'
};

let dupdialog;

const buttons = [
  {
    el: $loginButton,
    handler: _ => redirect('/auth')
  }, {
    el: $signupButton,
    handler: _ => redirect('/auth/signup')
  }, {
    el: $logoutButton,
    handler: _ => redirect('/auth/logout')
  }, {
    el: $dashboardLink,
    handler: _ => dashboard()
  }, {
    el: $addAlertBtn,
    handler: _ => redirect('/alerts/add')
  }, {
    el: $dupButton,
    handler: _ => openDuplicates()
  }, {
    el: $updateButton,
    handler: _ => run('/stations/update')
  }, {
    el: $scrape,
    handler: _ => run('/stations/scrape')
  }
];

for (const { el, handler } of buttons) {
  if (el) em.add(el, EventManager.types.click, handler, true, NAMESPACE.menuButton);
}

/**
 * Toggles the user menu open/close state
 *
 * @function
 * 
 * @param {Event} ev
 * @returns {void}
 */
async function open(ev) {
  if (qs('.backdrop')) return;
  const $backdrop = document.createElement('div');
  $backdrop.classList.add('backdrop');
  em.add($backdrop, EventManager.types.click, _ => close(), null, NAMESPACE.backdropClick);
  document.body.appendChild($backdrop);

  const { top } = $userMenuButton.getBoundingClientRect();
  const left = 8;
  $userMenu.style.top = `${top + 8}px`;
  $userMenu.style.left = `${left}px`;
  await sleep(20);
  await raf();
  $backdrop.setAttribute('visible', true);
  $userMenu.setAttribute('open', true);
}


/**
 * Closes the user menu
 * 
 * @function
 * 
 * @returns {void}
 */
async function close() {
  const $bd = qs('.backdrop');
  if (!$bd) return;
  let timeoutID = null;
  const cleanup = () => {
    if (timeoutID) clearTimeout(timeoutID);
    if (!$bd) return;
    em.removeByNamespace(NAMESPACE.backdropClick);
    $bd.remove();
  };
  em.add($bd, EventManager.types.transitionend, _ => cleanup(), null, NAMESPACE.backdropClick);
  timeoutID = setTimeout(() => cleanup(), 300);
  await raf();
  $userMenu.removeAttribute('open');
  $bd.removeAttribute('visible');
}

/**
 * runs an endpoint cmd
 * 
 * @param {String} cmd 
 */
async function run(cmd) {
  try {
    const res = await fetch(cmd);
    if (!res.ok) throw new Error('api failure');
    const { message } = await res.json();
    new Toast(message);
  } catch (e) {
    new Toast(`${cmd} failed: ${e}`);
  }
}

/**
 * Redirects
 *
 * @returns {void}
 */
function redirect(path) {
  try {
    window.location.href = new URL(
      path,
      window.location.origin
    ).toString();
  } catch (e) {
    console.error('redirect failed: ', e);
  }
}

/**
 * creates a user image element
 * 
 * @private
 * @function
 * 
 * @param {Object} user
 * @param {String} user.picture
 * @param {Number} size
 * @returns {HTMLElement}
 */
function userImage({ picture }, size) {
  if (!picture) return;
  const img = document.createElement('img');
  img.src = picture;
  img.alt = 'user profile picture';
  img.width = size;
  return img;
}

/**
 * loads the user data to UI
 * 
 * @function
 * 
 * @param {Object} user
 * @param {String} user.firstName
 * @param {String} user.lastName
 * @param {String} user.picture
 * @return {void}
 */
function loadUser(user) {
  if (!user) return;

  const small = userImage(user, 24);
  const big = userImage(user, 70);

  if (big) qs(selectors.userAvatar).replaceChildren(big);
  if (small) $userMenuButton.replaceChildren(small);

  qs(selectors.firstname).textContent = user.firstName;
  qs(selectors.lastname).textContent = user.lastName;

  const input = qs(selectors.shareInput);
  if (input) input.value = txtDownloadUrl();
}

/**
 * opens the dashboard page in a sererate window
 * 
 * @function
 */
function dashboard() {
  try {
    const url = new URL('/dashboard', window.location.origin);
    window.open(
      url.toString(),
      "_blank",
      "noopener,noreferrer"
    );
  } catch (e) {
    new Toast('Failed to open dashboard');
    console.error(e);
  }
}

/**
 * opens the duplicates dialog in admin dashboard
 * 
 * @function
 */
function openDuplicates() {
  if (!dupdialog) {
    dupdialog = new DupDialog(selectors.duplicates);
  }
  dupdialog.open();
}

/**
 * displays the share button if user is logged in and has selected stations
 * 
 * @public
 * @function
 * 
 * @return {void}
 */
function loadShareButton() {
  $sharelink.style.display = 'flex';
}

export default {
  open,
  close,
  loadUser,
  loadShareButton
}