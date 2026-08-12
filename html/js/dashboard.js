import Toast from './CustomRadioApp/Toast/Toast.js';
import EventManager from './CustomRadioApp/EventManager/EventManager.js';

import userMenu from './CustomRadioApp/UIManager/menu/menu.js';
import selectors from './CustomRadioApp/selectors.js';

import msToHhMmSs from '../../src/util/msToHhMmSs.js';
import sleep from './CustomRadioApp/utils/sleep.js';

const MAX_LOG_LINES = 500;
const MAX_HISTORY = 1000;

const validLevels = new Set([
  'debug',
  'info',
  'warning',
  'error',
  'critical'
]);

const em = new EventManager();

let requestsChart;
const history = [];
let timeoutID = 0;
let requestsController;
const usedElements = {};

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
  const $el = (usedElements[selector] != null) ? usedElements[selector] : document.querySelector(selector);
  if (!usedElements[selector]) usedElements[selector] = $el;
  return $el;
}

function updateText(selector, text) {
  try {
    const $el = qs(selector);
    if (!$el) throw new Error('Element missing');
    if ($el.textContent === text) return;
    requestAnimationFrame(_ => $el.textContent = text);
  } catch (er) {
    console.error(`Error updating ${selector} text: ${er}`);
  }
}

function updateTexts(list) {
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

function nextWeeksUpdateDate() {
  const d = new Date();
  const daysUntilNextSunday = 7 - d.getDay();
  d.setDate(d.getDate() + daysUntilNextSunday);
  d.setHours(0, 0, 0, 0);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  const timePeriodSelector = qs('#hours');
  em.add(timePeriodSelector, em.types.change, ev => selectorChanged(ev));

  const userMenuButton = qs(selectors.userMenuButton);
  em.add(userMenuButton, em.types.click, _ => userMenu.open());

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
    const { timestamp, level, message } = JSON.parse(line);
  
    const $timestamp = document.createElement('span');
    $timestamp.textContent = timestamp;
  
    const normalizedLevel = String(level).toLowerCase();
    const levelClass = validLevels.has(normalizedLevel) ? normalizedLevel : 'unknown';
  
    const $level = document.createElement('span');
    $level.classList.add(levelClass);
    $level.textContent = `[${level}]`;
  
    const $message = document.createElement('span');
    $message.textContent = message;
  
    const $wrapper = document.createElement('div');
    $wrapper.append($timestamp, $level, $message);
    $wrapper.title = message;
  
    appendLogLine($wrapper);
  
    await sleep(40);
    keepAtBottom();
  } catch(err) {
    console.error(`invalid log data: ${err}`);
  }
}

function keepAtBottom() {
  const scrollContainer = qs('#log');
  requestAnimationFrame(() => scrollContainer.scrollTop = scrollContainer.scrollHeight);
}

function tailLog() {
  const es = new EventSource("/logs", {withCredentials: true});
  es.onmessage = e => logLine(e.data);
  es.onerror = e => console.error(e);
}

function updateProgBar(percent) {
  const $progBar = qs('#progress>.bar');
  requestAnimationFrame(_ => {
    $progBar.style.transform = `translateX(-${100 - percent}%)`;
  });
  $progBar.title = `${percent}% Completed`;
}

function updateTimeout($updatesCard) {
  clearTimeout(timeoutID);
  $updatesCard.style.display = 'none';
  timeoutID = setTimeout(_ => updateProgBar(0), 1000);
}

function updateProgress(ev) {
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
      heap,
      RSS,
      time,
      type
    } = JSON.parse(ev.data);

    updateText('#updates>h4', (type === 'update') ? 'UPDATING' : 'SCRAPING');

    const $updatesCard = qs('#updates');
    $updatesCard.style.display = 'flex';
    if (timeoutID) clearTimeout(timeoutID);
    timeoutID = setTimeout(_ => updateTimeout($updatesCard), 60000);

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
          el:'#RSS',
          str: `${RSS} MB`
        }
      ]);
    }

    if (percent != null) {
      updateProgBar(percent);
      updateTexts([
        {
          el: '#percent',
          str: `${percent}%`
        }, {
          el: '#changed',
          str: String(changed)
        }, {
          el: '#remaining',
          str: String(remaining)
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
          str: String(end.online)
        }, {
          el: '#nextUpdate',
          str: nextWeeksUpdateDate()
        }, {
          el: '#runTime',
          str: duration
        }, {
          el: '#total',
          str: String(end.total)
        }
      ]);
    }
  } catch (e) {
    console.error(e.message);
  }
}

function progressStatus() {
  const es = new EventSource('/progress', {withCredentials: true});
  es.onmessage = ev => updateProgress(ev);
  es.onerror = e => console.error(e);
}

function loaded() {
  userMenu.loadUser(window.user);
  addListeners();
  renderChart(window.requests);
  const { changed, start, end, type, version } = window.lastUpdate;
  updateTexts([
    {
      el: '#updateDuration',
      str: msToHhMmSs(end.time - start.time)
    }, {
      el: '#nextUpdate',
      str: nextWeeksUpdateDate()
    }
  ]);
  tailLog();
  progressStatus();
}

window.addEventListener('DOMContentLoaded', loaded);