import EventManager from '../../EventManager/EventManager.js';
import Toast from '../../Toast/Toast.js';

import selectors from '../../selectors.js';

import raf from '../../utils/raf.js';
import sleep from '../../utils/sleep.js';
import txtDownloadUrl from '../../utils/txtDownloadUrl.js';

const em = new EventManager();

const $userMenuButton = document.querySelector(selectors.userMenuButton);

const $userMenu = document.querySelector(selectors.userMenu);

const $loginButton = document.querySelector(selectors.login);
const $logoutButton = document.querySelector(selectors.logout);
const $signupButton = document.querySelector(selectors.signup);
const $addAlertBtn = document.querySelector(selectors.addAlertBtn);
const $dupButton = document.querySelector(selectors.dupButton);
const $updateButton = document.querySelector(selectors.updateButton);
const $scrape = document.querySelector(selectors.scrape);

const $sharelink = document.querySelector(selectors.sharelink);
const $dashboardLink = document.querySelector(selectors.dashboard);

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
    handler: _ => redirect('/stations/duplicates')
  }, {
    el: $updateButton,
    handler: _ => run('/stations/update')
  }, {
    el: $scrape,
    handler: _ => run('/stations/scrape')
  }
];

for (const { el, handler } of buttons) {
  if (el) em.add(el, em.types.click, handler, true, NAMESPACE.menuButton);
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
  if (document.querySelector('.backdrop')) return;
  const $backdrop = document.createElement('div');
  $backdrop.classList.add('backdrop');
  em.add($backdrop, em.types.click, _ => close(), null, NAMESPACE.backdropClick);
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
  const $bd = document.querySelector('.backdrop');
  if (!$bd) return;
  let timeoutID = null;
  const cleanup = () => {
    if (timeoutID) clearTimeout(timeoutID);
    if (!$bd) return;
    em.removeByNamespace(NAMESPACE.backdropClick);
    $bd.remove();
  };
  em.add($bd, em.types.transitionend, _ => cleanup(), null, NAMESPACE.backdropClick);
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

  document.querySelector(selectors.userAvatar).replaceChildren(big);
  $userMenuButton.replaceChildren(small);

  document.querySelector(selectors.firstname).textContent = user.firstName;
  document.querySelector(selectors.lastname).textContent = user.lastName;

  const input = document.querySelector(selectors.shareInput);
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