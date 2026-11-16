const UPDATE_UI_TIMEOUT = 12000;
const MAX_HISTORY = 500;
const DEFAULT_LOG_LEVEL = 1;
const MAX_LOG_LINES = 1000;

import Toast from './CustomRadioApp/Toast/Toast.js';
import EventManager from './CustomRadioApp/EventManager/EventManager.js';
import CollapsingHeader from './CustomRadioApp/UIManager/CollapsingHeader/CollapsingHeader.js';
import RequestsChart from './CustomRadioApp/Charts/RequestsChart.js';
import TimeoutManager from './CustomRadioApp/utils/TimeoutManager.js';
import StreamManager from './CustomRadioApp/EventSourceManager/EventSourceManager.js';
import ConfirmationDialog from './CustomRadioApp/UIManager/dialogs/ConfirmationDialog.js';
import FrontendLog from './CustomRadioApp/utils/FrondEndLog.js';

import userMenu from './CustomRadioApp/UIManager/menu/menu.js';
import selectors from './CustomRadioApp/selectors.js';

import msToHhMmSs from '../../src/util/msToHhMmSs.js';
import raf from './CustomRadioApp/utils/raf.js';
import { qs, qsAll } from './CustomRadioApp/utils/querySelectors.js';

const history = [];
let requestsController;
let timeInterval;

const timeouts = new TimeoutManager();
const em = new EventManager();
const header = new CollapsingHeader();
const streams = new StreamManager();
const requestsChart = new RequestsChart(qs('#requests'));
const logz = new FrontendLog({
  container: qs('#log'),
  level: DEFAULT_LOG_LEVEL,
  levelSelector: qs('#level'),
  maxLines: MAX_LOG_LINES
});


function formatNumber(num) {
  num = Number(num);
  return num >= 1000 ? num.toLocaleString("en-US") : num;
}

function updateText(selector, text) {
  try {
    const $el = qs(selector);
    if (!$el) throw new Error('Element missing');
    const str = String(text);
    if ($el.textContent === str) return;
    $el.textContent = str;
  } catch (er) {
    console.error(`Error updating ${selector} text: ${er}`);
  }
}

async function updateTexts(list) {
  if (!Array.isArray(list)) throw Error('"list" must be of type Array');
  await raf();
  for (const { el, str } of list) updateText(el, str);
}

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

function nextScheduledUpdate() {
  const now = new Date();

  // Next Sunday at midnight
  const nextSunday = new Date(now);
  const daysUntilNextSunday = (7 - now.getDay()) % 7;

  nextSunday.setDate(now.getDate() + daysUntilNextSunday);
  nextSunday.setHours(0, 0, 0, 0);

  // If it's already Sunday at midnight (i.e. that time has passed),
  // move to next Sunday.
  if (nextSunday <= now) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }

  // First of the month at noon
  const firstOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    12,
    0,
    0,
    0
  );

  // If this month's update has already happened, use next month
  if (firstOfMonth <= now) {
    firstOfMonth.setMonth(firstOfMonth.getMonth() + 1);
  }

  // Return whichever happens first
  const nextUpdate = nextSunday < firstOfMonth
    ? nextSunday
    : firstOfMonth;

  const date = nextUpdate.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    date,
    str: msToHhMmSs(nextUpdate.getTime() - now.getTime())
  };
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

function addListeners() {
  const listeners = [
    {
      el: qs('#hours'),
      type: EventManager.types.change,
      fn: selectorChanged
    }, {
      el: qs(selectors.userMenuButton),
      type: EventManager.types.click,
      fn: () => userMenu.open()
    }, {
      el: qs('#stop'),
      type: EventManager.types.click,
      fn: () => new ConfirmationDialog('Stop scan?', requestStop)
    }, {
      el: qs('main'),
      type: EventManager.types.scroll,
      fn: ev => header.scroll(ev.target.scrollTop)
    }
  ];

  for (const { el, type, fn } of listeners) em.add(el, type, fn);

  qsAll('.menu-button').forEach(btn => {
    em.add(btn, EventManager.types.click, () => userMenu.close());
  });
}

async function updateProgBar(percent) {
  const $progBar = qs('#progress>.bar');
  if (!$progBar) return;
  await raf();
  $progBar.style.transform = `translateX(-${100 - percent}%)`;
  $progBar.title = `${percent}% Completed`;
}

function hideUIwhenNoUpdate($updatesCard) {
  $updatesCard.style.display = 'none';
  timeouts.set('progress-reset', () => updateProgBar(0), 1000);
  const stopButton = qs('#stop');
  if (stopButton) stopButton.disabled = false;
}

function taskComplete(start, end) {
  const { date, str } = nextScheduledUpdate();
  updateTexts([
    {
      el: '#updateDuration',
      str: msToHhMmSs(end.time - start.time)
    }, {
      el: '#lastCompleted',
      str: new Date(end.time).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }, {
      el: '#online',
      str: formatNumber(end.online)
    }, {
      el: '#nextUpdate',
      str: date
    }, {
      el: '#nextTime',
      str
    }, {
      el: '#total',
      str: formatNumber(end.total)
    }
  ]);
}

function updateMemoryValues(rss, heapTotal, heapUsed, external, arrayBuffers, batch, time) {
  history.push({
    rss,
    heapTotal,
    heapUsed,
    external,
    arrayBuffers,
    batch,
    time
  });
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  updateTexts([
    {
      el: '#heap',
      str: `${formatNumber(heapUsed)} MB`
    }, {
      el: '#RSS',
      str: `${formatNumber(rss)} MB`
    }
  ]);
}

function updateValues(percent, type, changed, remaining, runTime, approxCompletion, approxCompletionTime, processed, total, stationsPerSecond) {
  const rawPercent = Number(percent);
  const percVal = Number.isFinite(rawPercent) ? Math.max(0, Math.min(100, rawPercent)) : 0;

  updateProgBar(percVal);
  updateTexts([
    {
      el: '#updateHeader',
      str: (type === 'update') ? 'UPDATING' : 'SCRAPING'
    }, {
      el: '#percent',
      str: `${percVal}%`
    }, {
      el: '#changed',
      str: formatNumber(changed)
    }, {
      el: '#remaining',
      str: formatNumber(remaining)
    }, {
      el: '#runTime',
      str: runTime
    }, {
      el: '#AC',
      str: approxCompletion
    }, {
      el: '#ACT',
      str: approxCompletionTime
    }, {
      el: '#counts',
      str: `${formatNumber(processed)} / ${formatNumber(total)}`
    }, {
      el: '#SPS',
      str: formatNumber(stationsPerSecond)
    }
  ]);
}

function extendUITimeout() {
  const $updatesCard = qs('#updates');
  if (!$updatesCard) return;
  $updatesCard.style.display = 'flex';
  timeouts.extend('updates', () => {
    hideUIwhenNoUpdate($updatesCard);
  }, UPDATE_UI_TIMEOUT);
}

function updateTaskProgress(ev) {
  try {
    const {
      processed,
      total,
      remaining,
      runTime,
      changed,
      approxCompletion,
      approxCompletionTime,
      percent,
      start,
      end,
      rss,
      heapTotal,
      heapUsed,
      external,
      arrayBuffers,
      time,
      type,
      stationsPerSecond,
      uptime,
      batch
    } = JSON.parse(ev.data);

    if (heapUsed != null && rss != null) {
      updateMemoryValues(
        rss,
        heapTotal,
        heapUsed,
        external,
        arrayBuffers,
        batch,
        time
      );
    }

    if (percent != null) {
      extendUITimeout();
      updateValues(
        percent,
        type,
        changed,
        remaining,
        runTime,
        approxCompletion,
        approxCompletionTime,
        processed,
        total,
        stationsPerSecond
      );
    }

    if (uptime != null) {
      updateTexts([{
        el: '#uptime',
        str: uptime
      }]);
    }

    if (start != null && end != null) {
      taskComplete(start, end);
    }
  } catch (e) {
    console.error('Failed to process progress event', e);
  }
}

function progressStatus() {
  streams.connect('progress', '/progress', {
    onMessage: updateTaskProgress,

    onError: (ev, state) => {
      if (state === EventSource.CLOSED) {
        new Toast('Progress stream permanently closed');
      }
    }
  });
}

async function requestStop() {
  try {
    const res = await fetch('/stop');
    if (!res.ok) throw new Error('API failure');
    const { message, stopping } = await res.json();
    new Toast(message);
    if (stopping) qs('#stop').disabled = true;
  } catch (err) {
    new Toast('Stop failed');
    console.error('stop failed:', err);
  }
}

function keepTimeUpdated() {
  const { date, str } = nextScheduledUpdate();
  updateTexts([{
      el: '#nextUpdate',
      str: date
    }, {
      el: '#nextTime',
      str
    }
  ]);
}

function loaded() {
  document.title = `Dashboard ${location.host}`;
  addListeners();

  userMenu.loadUser(window.user);
  displayRequestHistory(window.requests);
  const { start, end } = window.lastUpdate;
  taskComplete(start, end);
  timeInterval = setInterval(keepTimeUpdated, 1000);

  logz.start();
  progressStatus();
}

function dispose() {
  logz.destroy();
  streams.closeAll();
  requestsController?.abort();
  timeouts.clearAll();
  requestsChart.destroy();
  em.removeAll();
  clearInterval(timeInterval);
}

window.addEventListener('load', loaded, { once: true });
window.addEventListener('pagehide', dispose, { once: true });

window.filterStatus = s => logz.filterStatus(s);
window.showHistory = () => console.log(history);
window.followLog = () => logz.toggleFollow();