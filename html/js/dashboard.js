const UPDATE_UI_TIMEOUT = 15_000;
const MAX_HISTORY = 500;
const DEFAULT_LOG_LEVEL = 1;
const MAX_LOG_LINES = 1000;

import EventManager from './CustomRadioApp/EventManager/EventManager.js';

import CollapsingHeader from './CustomRadioApp/UIManager/CollapsingHeader/CollapsingHeader.js';
import UpdateUIManager from './CustomRadioApp/utils/UpdateUIManager.js';
import FrontendLog from './CustomRadioApp/utils/FrondEndLog.js';
import RequestLog from './CustomRadioApp/utils/RequestLog.js';

import userMenu from './CustomRadioApp/UIManager/menu/menu.js';

import { qs, qsAll } from './CustomRadioApp/utils/querySelectors.js';

const em = new EventManager();

let header;
let logz;
let updateUI;
let requestLog;

function loadUserMenu() {
  userMenu.loadUser(window.user);
  const listeners = [
    {
      el: qs('#login'),
      type: EventManager.types.click,
      fn: () => userMenu.open()
    }
  ];

  const menuButtons = [...qsAll('.menu-button')].map(el => ({
    el,
    type: EventManager.types.click,
    fn: () => userMenu.close()
  }));

  for (const { el, type, fn } of [...listeners, ...menuButtons]) {
    if (em.add(el, type, fn) < 0) 
      throw new Error(`Failed adding ${type} listener for: ${el.id || el.className}`);
  }
}

function loaded() {
  document.title = `Dashboard ${location.host}`;
  
  header = new CollapsingHeader({
    header: qs('body>header'),
    main: qs('main'),
    login: qs('#login')
  });
 
  loadUserMenu();
  
  updateUI = new UpdateUIManager({
    updateCard: qs('#updates'),
    progBar: qs('#progress>.bar'),
    stopButton: qs('#stop'),
    uiTimeout: UPDATE_UI_TIMEOUT,
    maxHistory: MAX_HISTORY
  });
  
  logz = new FrontendLog({
    container: qs('#log'),
    level: DEFAULT_LOG_LEVEL,
    syncButton: qs('#sync'),
    levelSelector: qs('#level'),
    maxLines: MAX_LOG_LINES
  });
  
  requestLog = new RequestLog({
    canvas: qs('#requests'),
    select: qs('#hours')
  });
}

function dispose() {
  em.removeAll();

  header.destroy();
  updateUI.destroy();
  logz.destroy();
  requestLog.destroy();
}

window.addEventListener('load', loaded, { once: true });
window.addEventListener('pagehide', dispose, { once: true });

window.filterStatus = s => logz.filterStatus(s);
window.showHistory = () => console.log(updateUI.history);