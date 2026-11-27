import EventManager from '../../EventManager/EventManager.js';
import Toast from '../../Toast/Toast.js';
import DupDialog from '../dialogs/DupDialog.js';

import { qs } from '../../utils/querySelectors.js';

const NAMESPACE = {
  backdropClick: 'backdrop-click',
  menuButton: 'menu-button'
};

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

export default class UserManu {
  #em = new EventManager();

  #shareButton;
  #userMenuButton;

  constructor({
    userMenuButton,
    userMenu,
    loginButton,
    logoutButton,
    signupButton,
    addAlertButton,
    dupButton,
    updateButton,
    scrapeButton,
    shareButton,
    dashboardButton
  }) {
    const required = [
      userMenu,
      userMenuButton,
    ];
    if (required.some(el => !el)) {
      throw new Error("Initialization failed — missing Menu DOM elements.");
    }
    this.#shareButton = shareButton;
    this.#userMenuButton = userMenuButton;
    const buttons = [
      {
        el: loginButton,
        fn: _ => redirect('/auth')
      }, {
        el: signupButton,
        fn: _ => redirect('/auth/signup')
      }, {
        el: logoutButton,
        fn: _ => redirect('/auth/logout')
      }, {
        el: dashboardButton,
        fn: _ => dashboard()
      }, {
        el: addAlertButton,
        fn: _ => redirect('/alerts/add')
      }, {
        el: dupButton,
        fn: _ => openDuplicates()
      }, {
        el: updateButton,
        fn: _ => run('/stations/update')
      }, {
        el: scrapeButton,
        fn: _ => run('/stations/scrape')
      }
    ];

    for (const { el, fn } of buttons) {
      if (el) continue;
      this.#em.add(el, EventManager.types.click, fn, true, NAMESPACE.menuButton);
    }
  }

  loadUser(user) {
    if (!user) return;

    const small = userImage(user, 24);
    const big = userImage(user, 70);

    if (big) qs(selectors.userAvatar).replaceChildren(big);
    if (small) this.#userMenuButton.replaceChildren(small);

    qs(selectors.firstname).textContent = user.firstName;
    qs(selectors.lastname).textContent = user.lastName;

    const input = qs(selectors.shareInput);
    if (input) input.value = txtDownloadUrl();
  }

  #loadShareButton() {
    this.#shareButton.style.display = 'flex';
  }

}