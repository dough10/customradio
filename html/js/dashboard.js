import Toast from './CustomRadioApp/Toast/Toast.js';
import EventManager from './CustomRadioApp/EventManager/EventManager.js';
import CollapsingHeader from './CustomRadioApp/UIManager/CollapsingHeader/CollapsingHeader.js';

import userMenu from './CustomRadioApp/UIManager/menu/menu.js';
import selectors from './CustomRadioApp/selectors.js';

import msToHhMmSs from '../../src/util/msToHhMmSs.js';
import sleep from './CustomRadioApp/utils/sleep.js';
import raf from './CustomRadioApp/utils/raf.js';
import ConfirmationDialog from './CustomRadioApp/UIManager/dialogs/ConfirmationDialog.js';

const MAX_LOG_LINES = 1000;
const MAX_HISTORY = 1000;

const levels = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
  security: 5
};

const UPDATE_TIMEOUT = 20000;
const DEFAULT_LOG_LEVEL = 1;
let logLevel = DEFAULT_LOG_LEVEL;

const validLevels = new Set(Object.keys(levels));
const validLevelsNumeric = new Set(Object.values(levels));

const em = new EventManager();
const header = new CollapsingHeader();

let requestsChart;
const history = [];
let timeoutID = 0;
let requestsController;
const usedElements = new Map();
let followingBackendLogLevel = true;

const chartOptions = {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true
    },
    x: {
      ticks: {
        autoSkip: true,
        maxTicksLimit: 8
      }
    }
  }
};

function qs(selector) {
  if (!usedElements.has(selector)) {
    const $el = document.querySelector(selector);
    if (!$el) return null;
    usedElements.set(selector, $el);
  }
  return usedElements.get(selector);
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
  await raf();
  for (const { el, str } of list) updateText(el, str);
}

function renderChart({ averagePerHour, counts, times, totalRequests }) {
  updateTexts([
    {
      el: '#reqTotal',
      str: totalRequests
    }, {
      el: '#ave',
      str: averagePerHour
    }
  ]);
  const canvas = qs('#requests');
  if (!canvas) return;
  if (!requestsChart) {
    requestsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: times,
        datasets: [{
          label: 'requests',
          data: counts,
          borderWidth: 1,
          backgroundColor: 'rgba(166, 136, 250, 1)'
        }]
      },
      options: chartOptions
    });
    return;
  }
  requestsChart.data.labels = times;
  requestsChart.data.datasets[0].data = counts;
  requestsChart.update();
}

function nextScheduledUpdate() {
    const d = new Date();
    const daysUntilNextSunday = 7 - d.getDay();
    d.setDate(d.getDate() + daysUntilNextSunday);
    d.setHours(0, 0, 0, 0);
    const date = d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return {
      date,
      str: msToHhMmSs(d.getTime() - Date.now())
    };
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
    renderChart(await res.json());
  } catch (error) {
    if (error.name === 'AbortError') return;
    console.error(error);
    new Toast(`Selection failed: ${error.message}`);
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
      type: em.types.change,
      fn: selectorChanged
    }, {
      el: qs(selectors.userMenuButton),
      type: em.types.click,
      fn: _ => userMenu.open()
    }, {
      el: qs('#level'),
      type: em.types.change,
      fn: logLevelChanged
    }, {
      el: qs('#stop'),
      type: em.types.click,
      fn: _ => new ConfirmationDialog('stop database scan?', requestStop)
    }, {
      el: qs('main'),
      type: em.types.scroll,
      fn: ev => header.scroll(ev.target.scrollTop)
    }
  ];
  for (const { el, type, fn } of listeners) em.add(el, type, fn);

  document.querySelectorAll('.menu-button').forEach(btn => {
    em.add(btn, em.types.click, _ => userMenu.close());
  });
}

function appendLogLine(wrapper) {
  const log = qs('#log');
  log.append(wrapper);
  while (log.children.length > MAX_LOG_LINES) {
    log.firstElementChild.remove();
  }
}

async function logLine(line) {
  try {
    const { timestamp, level, message, threshold } = JSON.parse(line);

    const backendLevel = Number(threshold);

    if (followingBackendLogLevel && validLevelsNumeric.has(backendLevel)) {
      setLogLevel(backendLevel);
    }

    const normalizedLevel = String(level).toLowerCase();
    const levelClass = validLevels.has(normalizedLevel) ? normalizedLevel : null;
    if (!levelClass) return;

    const lineLevel = levels[levelClass];

    const $timestamp = document.createElement('span');
    $timestamp.textContent = timestamp;

    const $level = document.createElement('span');
    $level.classList.add(levelClass);
    $level.textContent = `[${level}]`;

    const $message = document.createElement('span');
    $message.textContent = message;

    const $wrapper = document.createElement('div');
    $wrapper.append($timestamp, $level, $message);
    $wrapper.dataset.level = lineLevel;
    $wrapper.title = message;
    $wrapper.hidden = lineLevel < logLevel;

    appendLogLine($wrapper);

    await sleep(40);
    keepAtBottom();
  } catch (err) {
    console.error('Invalid log data:', err);
  }
}

function setLogLevel(level) {
  logLevel = validLevelsNumeric.has(level) ? level : DEFAULT_LOG_LEVEL;

  const selector = qs('#level');
  if (selector) selector.value = String(logLevel);

  document.querySelectorAll('#log > [data-level]').forEach(line => {
    line.hidden = Number(line.dataset.level) < logLevel;
  });
}

function logLevelChanged(ev) {
  followingBackendLogLevel = false;
  const level = Number(ev.target.value);
  setLogLevel(level);
}

async function keepAtBottom() {
  const scrollContainer = qs('#log');
  await raf();
  scrollContainer.scrollTop = scrollContainer.scrollHeight;
}

function tailLog() {
  const es = new EventSource("/logs");
  es.onmessage = e => logLine(e.data);
  es.onerror = _ => new Toast('Log stream connection error');
}

async function updateProgBar(percent) {
  const $progBar = qs('#progress>.bar');
  if (!$progBar) return;
  await raf();
  $progBar.style.transform = `translateX(-${100 - percent}%)`;
  $progBar.title = `${percent}% Completed`;
}

function updateTimeout($updatesCard) {
  clearTimeout(timeoutID);
  $updatesCard.style.display = 'none';
  timeoutID = setTimeout(_ => updateProgBar(0), 1000);
  qs('#stop').disabled = false;
}

function updateProgress(ev) {
  try {
    const {
      processed,
      total,
      remaining,
      runTime,
      changed,
      approxCompletionTime,
      percent,
      start,
      end,
      heap,
      RSS,
      time,
      type
    } = JSON.parse(ev.data);

    updateText('#updateHeader', (type === 'update') ? 'UPDATING' : 'SCRAPING');

    const $updatesCard = qs('#updates');
    $updatesCard.style.display = 'flex';
    if (timeoutID) clearTimeout(timeoutID);
    timeoutID = setTimeout(_ => updateTimeout($updatesCard), UPDATE_TIMEOUT);

    if (heap != null && RSS != null) {
      history.push({
        heap,
        RSS,
        time
      });
      if (history.length > MAX_HISTORY) {
        history.shift();
      }
      updateTexts([
        {
          el: '#heap',
          str: `${heap} MB`
        }, {
          el: '#RSS',
          str: `${RSS} MB`
        }
      ]);
    }

    if (percent != null) {
      const value = Math.max(0, Math.min(100, Number(percent)));
      updateProgBar(value);
      updateTexts([
        {
          el: '#percent',
          str: `${value}%`
        }, {
          el: '#changed',
          str: changed
        }, {
          el: '#remaining',
          str: remaining
        }, {
          el: '#runTime',
          str: runTime
        }, {
          el: '#ACT',
          str: approxCompletionTime
        }, {
          el: '#counts',
          str: `${processed}/${total}`
        }
      ]);
    }

    if (start != null && end != null) {
      const duration = msToHhMmSs(end.time - start.time);
      updateTexts([
        {
          el: '#updateDuration',
          str: duration
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
          str: end.online
        }, {
          el: '#nextUpdate',
          str: nextScheduledUpdate()
        }, {
          el: '#total',
          str: end.total
        }
      ]);
    }
  } catch (e) {
    console.error('Failed to process progress event', e);
  }
}

function progressStatus() {
  const es = new EventSource('/progress');
  es.onmessage = ev => updateProgress(ev);
  es.onerror = _ => new Toast('Progress stream connection error');
}

function createOptions(key, val) {
  const $option = document.createElement('option');
  $option.value = val;
  $option.textContent = key;
  return $option;
}

function loadLogLevels() {
  const selector = qs('#level');
  if (!selector) return;
  for (const [key, val] of Object.entries(levels)) {
    const $option = createOptions(key, val);
    selector.append($option);
  }
  setLogLevel(DEFAULT_LOG_LEVEL);
}

async function requestStop() {
  try {
    const res = await fetch('/stop');
    if (!res.ok) throw new Error('API failure')
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
  loadLogLevels();
  addListeners();
  userMenu.loadUser(window.user);
  renderChart(window.requests);
  const { start, end } = window.lastUpdate;
  updateTexts([
    {
      el: '#updateDuration',
      str: msToHhMmSs(end.time - start.time)
    }
  ]);
  keepTimeUpdated();
  setInterval(keepTimeUpdated, 1000);
  tailLog();
  progressStatus();
}

window.onload = loaded;