import Toast from './CustomRadioApp/Toast/Toast.js';
import EventManager from './CustomRadioApp/EventManager/EventManager.js';

import userMenu from './CustomRadioApp/UIManager/menu/menu.js';
import selectors from './CustomRadioApp/selectors.js';

import msToHhMmSs from '../../src/util/msToHhMmSs.js';
import sleep from './CustomRadioApp/utils/sleep.js';

const em = new EventManager();

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

let requestsChart;

function updateText(selector, text) {
  try {
    document.querySelector(selector).textContent = text;
  } catch(er) {
    console.error(`Error updating ${selector} text: ${er}`);
  }
}

function renderChart({ averagePerHour, counts, times, totalRequests }) {
  const canvas = document.getElementById('requests');
  updateText('#total', totalRequests);
  updateText('#ave', averagePerHour);
  if (!requestsChart) {
    requestsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: times,
        datasets: [{
          label: 'requests',
          data: counts,
          borderWidth: 1
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

function nextUpdate() {
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
  try {
    const res = await fetch(`/requests/${ev.target.value}`);
    if (!res.ok) throw new Error('API endpoint failure');
    const data = await res.json();
    renderChart(data); 
  } catch(e) {
    new Toast(`selecton Failed: ${e}`);
  }
}

function addListeners() {
  const timePeriodSelector = document.querySelector('#hours');
  em.add(timePeriodSelector, em.types.change, ev => selectorChanged(ev));

  const userMenuButton = document.querySelector(selectors.userMenuButton);
  em.add(userMenuButton, em.types.click, _ => userMenu.open());

  document.querySelectorAll('.menu-button').forEach(btn => {
    em.add(btn, em.types.click, _ => userMenu.close());
  });
}

async function logLine(line) {
  const {timestamp, level, message} = JSON.parse(line);

  const $timestamp = document.createElement('span');
  $timestamp.textContent = timestamp;
  
  const $level = document.createElement('span');
  $level.classList.add(level.toLowerCase());
  $level.textContent = `[${level}]`;

  const $message = document.createElement('span');
  $message.textContent = message;

  const $wrapper = document.createElement('div');
  $wrapper.append($timestamp, $level, $message);
  $wrapper.title = message;

  document.querySelector('#log').append($wrapper);

  await sleep(40);
  keepAtBottom();
}

function keepAtBottom() {
  const scrollContainer = document.querySelector('#log');
  requestAnimationFrame(() => scrollContainer.scrollTop = scrollContainer.scrollHeight);
}

function tailLog() {
  const es = new EventSource("/logs");
  es.onmessage = e => logLine(e.data);
  es.onerror = e => {throw e}
}

function updateStatus() {
  const es = new EventSource('/progress');
  es.onmessage = e => console.log(JSON.parse(e.data));
  es.onerror = e => {throw e}
}

function loaded() {
  userMenu.loadUser(window.user);
  addListeners();
  renderChart(window.requests);
  const { changed, start, end, type, version } = window.lastUpdate;
  updateText('#updateDuration', msToHhMmSs(end.time - start.time));
  updateText('#nextUpdate', nextUpdate());
  tailLog();
  updateStatus();
}

window.onload = loaded;