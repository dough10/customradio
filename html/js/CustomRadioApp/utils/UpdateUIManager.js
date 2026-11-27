import Toast from "../Toast/Toast.js";
import TimeoutManager from "./TimeoutManager.js";
import StreamManager from "../EventSourceManager/EventSourceManager.js";
import ConfirmationDialog from "../UIManager/dialogs/ConfirmationDialog.js";
import EventManager from "../EventManager/EventManager.js";

import raf from "./raf.js";
import { updateTexts } from "./updateTexts.js";
import formatNumber from "./formatNumber.js";
import msToHhMmSs from "../../../../src/util/msToHhMmSs.js";

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

export default class UpdateUIManager {
  #timeouts = new TimeoutManager();
  #streams = new StreamManager();
  #em = new EventManager();

  #updateCard;
  #progBar;
  #stopButton;
  
  #uiTimeout;

  #history = [];
  #maxHistory;

  #interval;
  constructor({
    updateCard, 
    progBar, 
    stopButton, 
    uiTimeout = 12_000,
    maxHistory = 500
  }) {
    if (!(updateCard instanceof HTMLElement)) {
      throw new TypeError("updateCard must be an HTMLElement");
    }

    if (!(progBar instanceof HTMLElement)) {
      throw new TypeError("progBar must be an HTMLElement");
    }

    if (!(stopButton instanceof HTMLButtonElement)) {
      throw new TypeError("stopButton must be an HTMLButtonElement");
    }

    if (!Number.isInteger(uiTimeout) || uiTimeout < 1) {
      throw new TypeError("uiTimeout must be a positive integer");
    }

    if (!Number.isInteger(maxHistory) || maxHistory < 1) {
      throw new TypeError("maxHistory must be a positive integer");
    }

    this.#progBar = progBar;
    this.#stopButton = stopButton;
    this.#updateCard = updateCard;

    this.#uiTimeout = uiTimeout;
    this.#maxHistory = maxHistory;

    this.#start();
  }

  get history() {
    return this.#history.map(entry => Object.freeze({ ...entry }));
  }

  #hideUI() {
    this.#updateCard.style.display = 'none';
    this.#timeouts.set('progress-reset', () => this.#updateProgBar(0), 1000);
    this.#stopButton.disabled = false;
  }

  #extendUITimeout() {
    this.#updateCard.style.display = 'flex';
    this.#timeouts.extend('updates', () => this.#hideUI(), this.#uiTimeout);
  }

  async #updateProgBar(percent) {
    await raf();
    this.#progBar.style.transform = `translateX(-${100 - percent}%)`;
    this.#progBar.title = `${percent}% Completed`;
  }

  #updateValues(
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
  ) {
    this.#extendUITimeout();

    const rawPercent = Number(percent);
    const percVal = Number.isFinite(rawPercent) ? Math.max(0, Math.min(100, rawPercent)) : 0;

    this.#updateProgBar(percVal);
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

  #userChange({
    total_users,
    users_last_30_days,
    total_user_stations,
    user_stations_last_30_days
  }) {
    updateTexts([
      {
        el: '#totalUsers',
        str: formatNumber(total_users)
      }, {
        el: '#usersIn30',
        str: formatNumber(users_last_30_days)
      }, {
        el: '#userStationsCount',
        str: formatNumber(total_user_stations)
      }, {
        el: '#userStationsIn30',
        str: formatNumber(user_stations_last_30_days)
      }
    ]);
  }

  #updateTaskProgress(ev) {
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
        batch,
        userStats
      } = JSON.parse(ev.data);

      if (userStats != null) this.#userChange(userStats);

      if (heapUsed != null && rss != null) {
        this.#updateMemoryValues(
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
        this.#updateValues(
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
        this.#taskComplete(start, end);
      }
    } catch(e) {
      console.error('Failed to process progress event', e);
    }
  }

  #updateMemoryValues(
    rss, 
    heapTotal, 
    heapUsed, 
    external, 
    arrayBuffers, 
    batch, 
    time
  ) {
    this.#history.push({
      rss,
      heapTotal,
      heapUsed,
      external,
      arrayBuffers,
      batch,
      time
    });

    if (this.#history.length > this.#maxHistory) {
      this.#history.splice(0, this.#history.length - this.#maxHistory);
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

  #keepTimeUpdated() {
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

  #taskComplete(start, end) {
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

  async #requestStop() {
    try {
      const res = await fetch('/stop');
      if (!res.ok) throw new Error('API failure');
      const { message, stopping } = await res.json();
      new Toast(message);
      if (stopping) this.#stopButton.disabled = true;
    } catch (err) {
      new Toast('Stop failed');
      console.error('stop failed:', err);
    }
  }

  #start() {
    try {
      const { start, end } = window.lastUpdate;
      this.#taskComplete(start, end);
    } catch(e) {
      console.error(`Failed seeting inital update stats: ${e}`)
    }

    const listeners = [
      {
        el: this.#stopButton,
        type: EventManager.types.click,
        fn: () => new ConfirmationDialog('Stop scan?', () => this.#requestStop())
      }
    ];

    for (const { el, type, fn } of listeners) {
      if (this.#em.add(el, type, fn) < 0) 
        throw new Error(`Failed adding ${type} listener for: ${el.id || el.className}`);
    }

    this.#interval = setInterval(() => this.#keepTimeUpdated(), 1000);
    
    this.#streams.connect('progress', '/progress', {
      onMessage: ev => this.#updateTaskProgress(ev),
  
      onError: (ev, state) => {
        if (state === EventSource.CLOSED) {
          new Toast('Progress stream permanently closed');
        }
      }
    });
  }

  destroy() {
    clearInterval(this.#interval);
    this.#timeouts.clearAll();
    this.#streams.closeAll();
    this.#em.removeAll();
  }
}