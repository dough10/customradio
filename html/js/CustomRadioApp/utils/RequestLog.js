import Toast from "../Toast/Toast.js";
import RequestsChart from "../Charts/RequestsChart.js";
import EventManager from "../EventManager/EventManager.js";

import { qs, qsAll } from "./querySelectors.js";
import formatNumber from "./formatNumber.js";
import { updateTexts } from "./updateTexts.js";
import raf from "./raf.js";

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

export default class RequestLog {
  #em = new EventManager();
  
  #chart;
  #requestsController;

  constructor({
    canvas,
    select
  }) {
    this.#chart = new RequestsChart(canvas);
    const listeners = [
      {
        el: select,
        type: EventManager.types.change,
        fn: ev => this.#selectorChanged(ev)
      }
    ];

    for (const { el, type, fn } of listeners) {
      if (this.#em.add(el, type, fn) < 0) 
        throw new Error(`Failed adding ${type} listener for: ${el.id || el.className}`);
    }

    try {
      this.#displayRequestHistory(window.requests);
    } catch(e) {
      console.error(`Failed to load inital request history: ${e}`);
    }
  }

  async #displayRequestHistory({
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

    this.#reset();
    
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

    this.#chart.update(times, counts, interval);
    qs('#analytics').append($wrapper);
  }

  async #selectorChanged(ev) {
    this.#requestsController?.abort();
    const controller = new AbortController();
    this.#requestsController = controller;
    try {
      const res = await fetch(`/requests/${encodeURIComponent(ev.target.value)}`, {
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`API request failed: ${res.status}`);
      const data = validateRequestHistory(await res.json());
      await this.#displayRequestHistory(data);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error(error);
      new Toast(`Selection failed!!`);
    } finally {
      if (this.#requestsController === controller) {
        this.#requestsController = null;
      }
    }
  }

  #reset() {
    qsAll('.stats').forEach(el => el.remove());
  }

  destroy() {
    this.#chart.destroy();
  }
}