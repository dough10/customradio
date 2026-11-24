const UPDATE_UI_TIMEOUT = 15_000;
const MAX_HISTORY = 500;
const DEFAULT_LOG_LEVEL = 1;
const MAX_LOG_LINES = 1000;

import Toast from './CustomRadioApp/Toast/Toast.js';
import EventManager from './CustomRadioApp/EventManager/EventManager.js';
import CollapsingHeader from './CustomRadioApp/UIManager/CollapsingHeader/CollapsingHeader.js';
import RequestsChart from './CustomRadioApp/Charts/RequestsChart.js';
import TimeoutManager from './CustomRadioApp/utils/TimeoutManager.js';
import FrontendLog from './CustomRadioApp/utils/FrondEndLog.js';
import UpdateUIManager from './CustomRadioApp/utils/UpdateUIManager.js';

import userMenu from './CustomRadioApp/UIManager/menu/menu.js';

import raf from './CustomRadioApp/utils/raf.js';
import { qs, qsAll } from './CustomRadioApp/utils/querySelectors.js';
import { updateTexts } from './CustomRadioApp/utils/updateTexts.js';
import formatNumber from './CustomRadioApp/utils/formatNumber.js';

const em = new EventManager();
const timeouts = new TimeoutManager();

let requestsController;
let header;
let requestsChart;
let logz;
let updateUI;

function structureKey(title, count) {
  const $key = document.createElement('span');
  $key.textContent = title;

  const $val = document.createElement('span');
  $val.textContent = count;

  const $div = document.createElement('div');
  $div.append($key, $val);
  return $div;
}

function calcPercentString(little, big) {
  if (!Number.isFinite(big) || big <= 0) return '0.0%';
  return `${((little / big) * 100).toFixed(1)}%`;
}

function resetRequestHistory() {
  qsAll('.stats').forEach(el => el.remove());
}

function createSection(title, items, key, totalRequests, formatter = () => '') {
  const $wrapper = document.createDocumentFragment();

  const $h4 = document.createElement('h4');
  $h4.textContent = title;
  $wrapper.append($h4);

  for (const item of items) {
    const { count } = item;
    const label = item[key];
    const details = `${formatNumber(count)} (${calcPercentString(count, totalRequests)})`;

    const $el = structureKey(label, `${details}${formatter(item)}`);
    $wrapper.append($el);
  }

  return $wrapper;
}

function leftCol(browsers, methods, totalRequests) {
  const $wrapper = document.createElement('div');

  $wrapper.append(
    createSection('Browsers', browsers, 'browser', totalRequests),
    createSection('Methods', methods, 'method', totalRequests)
  );

  return $wrapper;
}

function rightCol(operatingSystems, statusCodes, totalRequests) {
  const $wrapper = document.createElement('div');

  $wrapper.append(
    createSection('Operating Systems', operatingSystems, 'os', totalRequests),
    createSection('Status', statusCodes, 'status', totalRequests)
  );

  return $wrapper;
}

function centerCol(paths, totalRequests) {
  const $wrapper = document.createElement('div');

  $wrapper.append(
    createSection(
      'Paths',
      paths,
      'path',
      totalRequests,
      ({ averageResponseTime }) =>
        averageResponseTime > 0 ? `, ${formatNumber(averageResponseTime)} ms` : ''
    )
  );

  return $wrapper;
}

function formatTotalRequestString(t, n, f) {
  return t === n ? formatNumber(t) : `Total: ${formatNumber(t)}, Valid: ${formatNumber(n)} (${calcPercentString(n, t)}), 4xx: ${formatNumber(f)} (${calcPercentString(f, t)})`;
}

async function displayRequestHistory({
  uniqueIPs,
  averageResponseTime,
  requestsPerHour,
  counts,
  times,
  totalRequests,
  non4xxRequests,
  browsers,
  operatingSystems,
  methods,
  statusCodes,
  paths,
  interval
}) {
  const fourxx = totalRequests - non4xxRequests;

  resetRequestHistory();
  await updateTexts([
    {
      el: '#reqTotal',
      str: formatTotalRequestString(totalRequests, non4xxRequests, fourxx)
    }, {
      el: '#ave',
      str: formatNumber(requestsPerHour)
    }, {
      el: '#ips',
      str: formatNumber(uniqueIPs)
    }, {
      el: '#ART',
      str: `${formatNumber(averageResponseTime)} ms`
    }
  ]);

  const $wrapper = document.createElement('div');
  $wrapper.classList.add('stats');
  $wrapper.append(
    leftCol(browsers, methods, totalRequests),
    centerCol(paths, totalRequests),
    rightCol(operatingSystems, statusCodes, totalRequests)
  );

  await raf();
  qs('#analytics').append($wrapper);

  requestsChart.update(times, counts, interval);
}

function validateRequestHistory(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid history response');
  }

  const arrays = [
    'browsers',
    'operatingSystems',
    'methods',
    'statusCodes',
    'paths',
    'counts',
    'times'
  ];

  for (const key of arrays) {
    if (!Array.isArray(data[key])) {
      throw new Error(`Invalid history field: ${key}`);
    }
  }

  return data;
}

async function selectorChanged(ev) {
  requestsController?.abort();
  const controller = new AbortController();
  requestsController = controller;
  try {
    const res = await fetch(`/requests/${encodeURIComponent(ev.target.value)}`, {
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    const data = validateRequestHistory(await res.json());
    await displayRequestHistory(data);
  } catch (error) {
    if (error.name === 'AbortError') return;
    console.error(error);
    new Toast(`Selection failed!!`);
  } finally {
    if (requestsController === controller) {
      requestsController = null;
    }
  }
}

function loadUserMenu() {
  userMenu.loadUser(window.user);
  const listeners = [
    {
      el: qs('#hours'),
      type: EventManager.types.change,
      fn: selectorChanged
    }, {
      el: qs('#login'),
      type: EventManager.types.click,
      fn: () => userMenu.open()
    }
  ];

  for (const { el, type, fn } of listeners) em.add(el, type, fn);

  qsAll('.menu-button').forEach(btn => {
    em.add(btn, EventManager.types.click, () => userMenu.close());
  });
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
  
  requestsChart = new RequestsChart(qs('#requests'));
  displayRequestHistory(window.requests);

}

function dispose() {
  updateUI.destroy();
  em.removeAll();
  requestsController?.abort();
  timeouts.clearAll();
  header.destroy();
  logz.destroy();
  requestsChart.destroy();
}

window.addEventListener('load', loaded, { once: true });
window.addEventListener('pagehide', dispose, { once: true });

window.filterStatus = s => logz.filterStatus(s);
window.showHistory = () => console.log(updateUI.history);