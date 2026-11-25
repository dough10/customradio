import ScrollMinder from "./ScrollMinder.js";
import EventManager from "../EventManager/EventManager.js";
import StreamManager from "../EventSourceManager/EventSourceManager.js";

import sleep from "./sleep.js";
import raf from "./raf.js";

function extractStatus(line) {
  return line.match(/status:\s*(\d{3})\b/)?.[1] ?? null;
}

function createOptions(key, val) {
  const $option = document.createElement('option');
  $option.value = val;
  $option.textContent = key;
  return $option;
}

export default class FrontendLog {
  static levels = Object.freeze({
    debug: 0,
    info: 1,
    warning: 2,
    error: 3,
    critical: 4,
    security: 5
  });
  static validLevels = new Set(Object.keys(FrontendLog.levels));
  static validLevelsNumeric = new Set(Object.values(FrontendLog.levels));
  static isValidStatusCode(code) {
    return Number.isInteger(code) && code >= 100 && code <= 599;
  }

  #scrollMinder;
  #em = new EventManager();
  #streams = new StreamManager();

  #container;
  #levelSelector;
  #syncButton;
  #maxLines;
  #logLevel;
  #selectedStatus = 0;
  #initialized = false;
  #followIncomingLogLines = true;
  #destroyed = false;

  constructor({
    container,
    level = 1,
    levelSelector,
    syncButton,
    maxLines = 1000,
    bottomThreshold = 50
  }) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError("container must be an HTMLElement");
    }

    if (!(levelSelector instanceof HTMLSelectElement)) {
      throw new TypeError("levelSelector must be an HTMLSelectElement");
    }

    if (!(syncButton instanceof HTMLButtonElement)) {
      throw new TypeError("syncButton must be an HTMLButtonElement");
    }

    if (!FrontendLog.validLevelsNumeric.has(level)) {
      throw new RangeError('Invalid log level');
    }

    if (!Number.isInteger(maxLines) || maxLines < 1) {
      throw new TypeError("maxLines must be a positive integer");
    }

    this.#container = container;
    this.#levelSelector = levelSelector;
    this.#syncButton = syncButton;
    this.#maxLines = maxLines;
    this.#logLevel = level;
    
    this.#loadLogLevels();
    
    this.#scrollMinder = new ScrollMinder(container, {
      onCloseToBottom: () => this.follow(),
      onScrollUp: () => this.unfollow(),
      bottomThreshold
    });

    const listeners = [
      {
        el: levelSelector, 
        type: EventManager.types.change, 
        fn: ev => this.setLevel(Number(ev.target.value))
      }, {
        el: syncButton,
        type: EventManager.types.click,
        fn: () => this.toggleFollow()
      }
    ];
    
    for (const { el, type, fn } of listeners) 
      this.#em.add(el, type, fn) < 0 ? console.error(`Failed adding listener for: ${el.id || el.className}`) : null;

    this.#start();
  }

  get maxScroll() {
    return this.#container.scrollHeight - this.#container.clientHeight;
  }

  #assertAlive() {
    if (this.#destroyed) {
      throw new Error('FrontendLog has been destroyed');
    }
  }

  #loadLogLevels() {
    for (const [key, val] of Object.entries(FrontendLog.levels)) {
      const $option = createOptions(key, val);
      this.#levelSelector.append($option);
    }
    this.setLevel(this.#logLevel);
  }

  #isLogLineVisible(line) {
    const levelVisible = Number(line.dataset.level) >= this.#logLevel;

    const statusVisible =
      !line.dataset.status ||
      this.#selectedStatus === 0 ||
      Number(line.dataset.status) === this.#selectedStatus;

    return levelVisible && statusVisible;
  }

  #appendLogLine(wrapper) {
    this.#container.append(wrapper);
  
    while (this.#container.children.length > this.#maxLines) {
      this.#container.firstElementChild.remove();
    }
  }

  #applyFilters() {
    for (const line of this.#container.children) {
      if (!line.hasAttribute('data-level')) continue;
      line.hidden = !this.#isLogLineVisible(line);
    }
  }

  #updateSyncIcon() {
    this.#syncButton.disabled = this.#followIncomingLogLines;
  }

  async #keepAtBottom() {
    await raf();

    if (this.#destroyed || !this.#followIncomingLogLines) return;

    this.#container.scrollTop = this.maxScroll;
  }

  async #logLine(line) {
    try {
      const { timestamp, level, message, threshold } = JSON.parse(line);

      const backendLevel = Number(threshold);

      if (!this.#initialized && FrontendLog.validLevelsNumeric.has(backendLevel)) {
        this.#initialized = true;
        this.setLevel(backendLevel);
      }

      const normalizedLevel = String(level).toLowerCase();
      const levelClass = FrontendLog.validLevels.has(normalizedLevel) ? normalizedLevel : null;
      if (!levelClass) return;

      const lineLevel = FrontendLog.levels[levelClass];

      const $timestamp = document.createElement('span');
      $timestamp.textContent = timestamp;

      const $level = document.createElement('span');
      $level.classList.add(levelClass);
      $level.textContent = `[${level}]`;

      const $message = document.createElement('span');
      $message.textContent = message;

      const statusCode = extractStatus(message);
      const $wrapper = document.createElement('div');
      $wrapper.append($timestamp, $level, $message);
      $wrapper.dataset.level = lineLevel;
      $wrapper.title = message;
      if (statusCode) $wrapper.dataset.status = statusCode;
      $wrapper.hidden = !this.#isLogLineVisible($wrapper);

      this.#appendLogLine($wrapper);
      await sleep(40);
      await this.#keepAtBottom();
    } catch (err) {
      console.error('Invalid log data:', err);
    }
  }

  #start() {
    this.#assertAlive();
    this.#streams.connect('logs', '/logs', {
      onMessage: ev => this.#logLine(ev.data),
      onError: (ev, state) => {
        if (state === EventSource.CLOSED) {
          console.error('Log stream permanently closed');
        }
      }
    });
  }

  stop() {
    this.#assertAlive();
    this.#streams.close('logs');
  }

  setLevel(level) {
    this.#assertAlive();

    if (!FrontendLog.validLevelsNumeric.has(level)) {
      throw new RangeError('Invalid log level');
    }
    
    this.#logLevel = level;
    this.#levelSelector.value = String(level);

    this.#applyFilters();
    this.#keepAtBottom();
  }

  filterStatus(statusCode) {
    this.#assertAlive();

    statusCode = Number(statusCode);

    if (statusCode !== 0 && !FrontendLog.isValidStatusCode(statusCode)) {
      throw new RangeError('Invalid HTTP status code');
    }

    this.#selectedStatus = statusCode;
    this.#applyFilters();
    this.#keepAtBottom();
  }

  toggleFollow() {
    this.#assertAlive();
    if (this.#followIncomingLogLines) {
      this.unfollow();
    } else {
      this.follow();
    }
  }

  follow() {
    this.#assertAlive();
    this.#followIncomingLogLines = true;
    this.#container.scrollTop = this.maxScroll;
    this.#updateSyncIcon();
  }
  
  unfollow() {
    this.#assertAlive();
    this.#followIncomingLogLines = false;
    this.#updateSyncIcon();
  }

  destroy() {
    if (this.#destroyed) return;

    this.#streams.closeAll();
    this.#scrollMinder.destroy();
    this.#em.removeAll();

    this.#destroyed = true;
  }
}