export {
  queryString,
  stamp,
  svgIcon,
  createSmallButton,
  createStationElement
};

const player = new Audio();

let pauseTimer = 0;


/**
 * wait an ammout of time
 * 
 * 
 * @param {ms} milliseconds
 * 
 * @returns {Promise<Void>} Nothing 
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const _toastCache = [];

/**
 * display a toast message
 *
 * @param {String} message - text to be displayed in the toast
 * @param {Number} _timeout - in seconds  || defualt 3.5 seconds  ** optional
 * @param {String} link - url to go to when toast is clicked
 * @param {String} linkText - yellow text
 */
class Toast {
  constructor(message, _timeout, link, linkText) {
    // push toast to cache if currently displaying a toast
    if (document.querySelector('#toast')) {
      _toastCache.push([
        message,
        _timeout,
        link,
        linkText
      ]);
      return;
    }
    // bind this to internal functions
    this._transitionEnd = this._transitionEnd.bind(this);
    this._cleanUp = this._cleanUp.bind(this);
    this._clicked = this._clicked.bind(this);

    // create the toast
    this._timer = false;
    this._timeout = _timeout * 1000 || 3500;
    this.toast = this._createToast();
    if (link && linkText) {
      this.toast.append(this._withLink(message, link, linkText));
    } else {
      this.toast.textContent = message;
    }
    document.querySelector('body').append(this.toast);
    sleep(25).then(_ => requestAnimationFrame(_ => {
      this.toast.toggleAttribute('opened');
    }));
  }

  /**
   * returns a new toast html element
   * 
   * @returns {HTMLElement} hot toast
   */
  _createToast() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.classList.add('toast');
    toast.addEventListener('transitionend', this._transitionEnd, true);
    toast.addEventListener('click', this._clicked, true);
    return toast;
  }

  /**
   * butter in the toast with some link info
   * @param {String} message - text string
   * @param {String} link - URL
   * @param {String} linkText - text string
   * 
   * @returns {HTMLElement} link wrapper
   */
  _withLink(message, link, linkText) {
    this.link = link;
    const mText = document.createElement('div');
    mText.textContent = message;

    const lText = document.createElement('div');
    lText.textContent = linkText;
    lText.classList.add('yellow-text');

    const wrapper = document.createElement('div');
    wrapper.classList.add('toast-wrapper');
    wrapper.append(mText, lText);
    return wrapper;
  }

  /**
   * event handler for toast click
   */
  _clicked(e) {
    if (this.link && typeof this.link === 'string' && isValidURL(this.link)) {
      window.open(this.link, "_blank");
    } else if (this.link && typeof this.link === 'function') {
      this.link();
    } else if (this.link) {
      console.error('Toast "link" paramater must be a valid URL or function.');
    }
    this._cleanUp();
  }

  /**
   * play closing animation and remove element from document
   */
  _cleanUp() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = false;
    }
    this.toast.addEventListener('transitionend', _ => {
      if (this.toast) this.toast.remove();
    });
    requestAnimationFrame(_ => {
      this.toast.removeAttribute('opened');
    });
  }

  /**
   * called after opening animation
   * sets up closing animation
   */
  _transitionEnd() {
    this._timer = setTimeout(this._cleanUp, this._timeout);
    this.toast.removeEventListener('transitionend', this._transitionEnd);
  }
}

/**
 * infinite loop to look if cached toast messages to be displayed
 */
setInterval(_ => {
  if (!_toastCache.length) {
    return;
  }
  if (document.querySelector('#toast')) {
    return;
  }
  new Toast(
    _toastCache[0][0],
    _toastCache[0][1],
    _toastCache[0][2],
    _toastCache[0][3]
  );
  _toastCache.splice(0, 1);
}, 500);

/**
 * Creates a loading animation in the element passed to the input
 * 
 * @param {HTMLElement} parent 
 * 
 * @returns {void}
 */
function loadingAnimation(parent) {
  if (parent.querySelector('.loading')) return;
  const div = document.createElement('div');
  div.classList.add('loading');
  for (let i = 0; i < 5; i++) {
    const circle = document.createElement('div');
    circle.classList.add('circle');
    div.append(circle);
  }
  parent.prepend(div);
}

/**
 * Updates the selected count displayed on the page and manages the state of the download button.
 * 
 * This function updates the text content of the element with the ID `#count` to display the provided number. 
 * It also enables or disables the download button (`#download`) based on whether the number is greater than zero.
 * If a global `_paq` tracking object is available, the function sends events to it based on the state of the button.
 * 
 * @param {number} number - The number to set as the selected count.
 * 
 * @fires _paq.push - If `_paq` is defined, the function tracks events related to enabling or disabling the download button.
 */
function setSelectedCount(number) {
  const count = document.querySelector('#count');
  const dlButton = document.querySelector('#download');
  count.textContent = number;
  if (number) {
    dlButton.removeAttribute('disabled');
  } else {
    if (!dlButton.hasAttribute('disabled')) {
      dlButton.toggleAttribute('disabled');
    }
  }
}

/**
 * toggles selected attribute
 * 
 * @param {Event} ev
 * 
 * @returns {void} 
 */
function toggleSelect(ev) {
  const el = ev.target.parentElement;
  el.toggleAttribute('selected');
  const all = Array.from(el.parentNode.querySelectorAll('li[selected]'));
  const forStorage = all.map(el => el.dataset).sort((a, b) => a.name.localeCompare(b.name));
  localStorage.setItem('selected', JSON.stringify(forStorage));
  setSelectedCount(all.length);
  if (el.hasAttribute('selected')) {
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Add to file', el.dataset.url]);
  } else {
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Remove from file', el.dataset.url]);
  }
}

/**
 * tag file with date and origin
 * 
 * @function
 * 
 * @returns {String}
 */
function stamp() {
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  return `# created by ${window.location.origin} [${formattedDate}]\n`;
}

/**
 * generates a text file download from selected items
 * 
 * @function
 * 
 * @returns {void}
 */
async function dlTxt() {
  const container = document.querySelector('#stations');
  const elements = Array.from(container.querySelectorAll('li[selected]'));
  const str = elements.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name))
    .map(el => `${el.dataset.name}, ${el.dataset.url}`).join('\n');

  const blob = new Blob([`${stamp()}\n${str}`], {
    type: 'text/plain'
  });

  const filename = 'radio.txt';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.append(link);
  link.click();
  document.body.removeChild(link);

  if (typeof _paq !== 'undefined') _paq.push(['trackLink', link.href, 'download']);
  URL.revokeObjectURL(link.href);
}

/**
 * creates a button element for context menu
 * 
 * @param {Object} buttonData - Object containing button details.
 * @param {Object} buttonData.icon - Object containing SVG attributes.
 * @param {String} buttonData.icon.viewbox - The viewBox attribute for the SVG element.
 * @param {String} buttonData.icon.d - The path data for the SVG path element.
 * @param {String} buttonData.text - The text for menu button.
 * @param {String} buttonData.title = the "title" for the button
 * @param {Function} buttonData.func - The function to be called on button click.
 * 
 * @returns {HTMLElement}
 */
function contextMenuItem({icon, text, title, func}) {
  const txt = document.createElement('span');
  txt.textContent = text;
  const li = document.createElement('li');
  li.title = title;
  li.append(svgIcon(icon), txt);
  li.addEventListener('click', _ => func());
  return li;
}

/**
 * sets absolute placement properties of context menu
 * 
 * @param {HTMLElement} menu 
 * @param {Number} X 
 * @param {Number} Y 
 * @param {Number} popupHeight 
 */
function placeMenu(menu, X, Y, popupHeight) {
  const wHeight = window.innerHeight / 2;
  const wWidth = window.innerWidth / 2;
  
  if (Y > wHeight) {
    menu.style.top = `${Y - popupHeight}px`;
  } else {
    menu.style.top = `${Y}px`;
  }
  if (X > wWidth) {
    menu.style.left = `${X - 250}px`;
  } else {
    menu.style.left = `${X + 10}px`;
  }
}

/**
 * add event listeners to dismiss popup element
 * 
 * @param {HTMLElement} popup 
 * @param {HTMLElement} body 
 */
function addPopupListeners(popup, body, backdrop) {
  const dismiss = _ => {
    body.removeEventListener('click', _ => dismiss());
    body.removeEventListener('contextmenu', _ => dismiss());
    popup.addEventListener('transitionend', _ => {
      backdrop.remove();
      popup.remove();
    });
    popup.removeAttribute('open');
    backdrop.removeAttribute('visable');
  };
  popup.addEventListener('mouseleave', _ => dismiss());
  body.addEventListener('click', _ => dismiss());
  body.addEventListener('contextmenu', _ => dismiss());
}

/**
 * opens the stations homepage if present
 * 
 * @param {String} homepage 
 * 
 * @returns {void}
 */
function openStationHomepage(homepage) {
  if (homepage === 'Unknown') {
    new Toast('No homepage header', 3);
    return;
  }
  
  try {
    if (!(homepage.startsWith('https://') || homepage.startsWith('http://'))) {
      homepage = 'http://' + homepage;
    }
    const url = new URL(homepage);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
    }
    window.open(url.toString());
  } catch(error) {
    new Toast('Error opening homepage');
    console.log(homepage);
    console.error('error validating url:', error);
  }
}

/**
 * marks a station as a duplicate in database for manual review
 * 
 * @param {String} url 
 */
async function markDuplicate(url) {
  try {
    const formBody = new URLSearchParams({
      url
    }).toString();
    const response = await fetch('/mark-duplicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });
    const result = await response.json();
    new Toast(result.message, 1.5);
  } catch (err) {
    console.error('error reporting stream issue:', err);
  }
} 

/**
 * opens a context menu at the click location
 * 
 * @param {Event} ev 
 */
async function contextMenu(ev) {
  if (ev.type === "contextmenu") ev.preventDefault();
  const el = ev.target;
  if (!el.dataset.name) return;
  const buttonData = [
    {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z'
      },
      text: 'mark duplicate',
      title: 'mark station duplicate',
      func:  _ => markDuplicate(el.dataset.url)
    }, {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z'
      },
      text : 'homepage',
      title: `navigate to ${el.dataset.homepage}`,
      func: _ => openStationHomepage(el.dataset.homepage)
    }
  ];
  const body = document.querySelector('body');
  const buttons = buttonData.map(contextMenuItem);
  const elementHeight = 40;
  const popupHeight = elementHeight * buttonData.length;
  const X = ev.pageX || ev.touches[0].pageX;
  const Y = ev.pageY || ev.touches[0].pageY;
  const popup = document.createElement('ul');
  const backdrop = document.createElement('div');

  backdrop.classList.add('backdrop');
  popup.classList.add('context-menu');
  popup.append(...buttons);
  placeMenu(popup, X, Y, popupHeight);
  body.append(popup, backdrop);
  await sleep(10);
  popup.addEventListener('transitionend', _ => addPopupListeners(popup, body, backdrop));
  backdrop.toggleAttribute('visable');
  popup.toggleAttribute('open');
}

/**
 * pushes an error to database
 * 
 * @async
 * @function
 * 
 * @param {String} url 
 * @param {Object} error 
 * 
 * @returns {void}
 */
async function postStreamIssue(url, error) {
  try {
    const formBody = new URLSearchParams({
      url,
      error
    }).toString();
    const response = await fetch('/stream-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });
    const result = await response.json();
    console.log(result.message);
  } catch (err) {
    console.error('error reporting stream issue:', err);
  }
}

/**
 * plays stream when button is clicked
 * 
 * reports any playback error to server where it is logged in the database
 * 
 * @async
 * @function
 * 
 * @param {Event} ev
 * 
 * @returns {void} 
 */
async function playStream(ev) {
  ev.preventDefault();
  const el = ev.target.parentElement;
  const url = el.dataset.url;
  const miniPlayer = document.querySelector('.player');
  try {
    document.querySelector('#name').textContent = el.dataset.name;
    document.querySelector('#bitrate').textContent = `${el.dataset.bitrate}kbps`;
    if (!miniPlayer.hasAttribute('playing')) {
      miniPlayer.toggleAttribute('playing');
    }
    player.src = url;
    player.load();
    await player.play();
    if (el.dataset.homepage !== 'Unknown') {
      new Toast(`Playing ${el.dataset.name}`, 3, el.dataset.homepage, 'homepage');
    } else {
      new Toast(`Playing ${el.dataset.name}`, 3);
    }
  } catch (error) {
    const str = `Error playing media: ${error.message}`;
    new Toast(str, 3);
    console.error(str);
    postStreamIssue(url, error.message);
  }
  if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Play stream', url]);
}

/**
 * creates an SVG icon 
 * 
 * @function
 * 
 * @param {Object} icon - Object containing SVG attributes.
 * @param {String} icon.viewbox - The viewBox attribute for the SVG element.
 * @param {String} icon.d - The path data for the SVG path element.
 * 
 * @returns {HTMLElement} SVG element with nested path
 */
function svgIcon({ viewbox, d }) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  path.setAttribute("d", d);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('viewBox', viewbox);
  svg.append(path);
  return svg;
}

/**
 * creates a HTML button with svg icon 
 * 
 * @function
 * 
 * @param {Object} buttonData - Object containing button details.
 * @param {Object} buttonData.icon - Object containing SVG attributes.
 * @param {String} buttonData.icon.viewbox - The viewBox attribute for the SVG element.
 * @param {String} buttonData.icon.d - The path data for the SVG path element.
 * @param {String} buttonData.cssClass - The CSS class to be added to the button.
 * @param {Function} buttonData.func - The function to be called on button click.
 * @param {String} buttonData.title - The button's title.
 * 
 * @returns {HTMLElement} button
 */
function createSmallButton({ icon, cssClass, func, title }) {
  const button = document.createElement('button');
  button.title = title;
  button.type = 'button';
  button.classList.add('small-button', cssClass);
  button.append(svgIcon(icon));
  button.addEventListener('click', func);
  return button;
}

/**
 * creates a list element for a online radio station
 * 
 * @function
 * 
 * @param {Object} station - Object containing station details.
 * @param {String} station.name - The name of the station.
 * @param {String} station.url - The URL of the station.
 * @param {String} station.bitrate - The bitrate of the station.
 * @param {String} station.genre - the stations return genre header
 * @param {String} station.icon - the station's icon
 * @param {String} station.homepage - the url to the stations homepage
 * 
 * @returns {HTMLElement} li element
 */
function createStationElement({ name, url, bitrate, genre, icon, homepage }) {
  const buttonData = [
    {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z'
      },
      cssClass: 'play',
      func: playStream,
      title: 'Play stream'
    }, {
      icon: {
        viewbox: '0 0 24 24',
        d: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'
      },
      cssClass: 'add',
      func: toggleSelect,
      title: 'Add to file'
    }, {
      icon: {
        viewbox: '0 -960 960 960',
        d: 'M200-440v-80h560v80H200Z'
      },
      cssClass: 'remove',
      func: toggleSelect,
      title: 'Remove from file'
    }
  ];

  let isScrolling = false;
  let pressTimer = 0;

  const buttons = buttonData.map(createSmallButton);

  const span = document.createElement('span');
  span.textContent = name;

  const div = document.createElement('div');
  if (bitrate === 'Unknown') bitrate = '???';
  div.textContent = `${bitrate}kbps`;
  div.title = div.textContent;

  const passive = { passive: true };
  const li = document.createElement('li');
  li.title = `${name}: ${genre}`;
  li.dataset.name = name;
  li.dataset.url = url;
  li.dataset.bitrate = bitrate;
  li.dataset.genre = genre;
  li.dataset.icon = icon;
  li.dataset.homepage = homepage;
  li.addEventListener('contextmenu', contextMenu);
  li.addEventListener('touchstart', ev => {
    isScrolling = false;
    pressTimer = setTimeout(_ => {
      if (!isScrolling) contextMenu(ev);
    }, 500);
  }, passive);
  li.addEventListener('touchend', _ => {
    clearTimeout(pressTimer);
  }, passive);
  li.addEventListener('touchmove', _ => {
    isScrolling = true;
  }, passive);
  li.append(span, div, ...buttons);
  return li;
}

/**
 * calculate how many station elements can fit in the current browser window height
 * 
 * @returns {Number} number of elements that will fit in browser window height
 */
function getPullCount() {
  return Math.round(window.innerHeight / 58);
}

/**
 * load more stations to the UI when user scrolls to end of loaded content
 * 
 * @function
 * 
 * @param {Array} list 
 * @param {HTMLElement} container
 * 
 * @returns {void} 
 */
function lazyLoadOnScroll(list, container) {
  let ndx = 0;
  let pullNumber = getPullCount();
  let loading = false;
  let lastTop = 0;

  function load() {
    if (loading || ndx >= list.length) return;
    loading = true;
    const slices = list.slice(ndx, ndx + pullNumber);
    const fragment = document.createDocumentFragment();
    slices.forEach(slice => {
      slice.name = slice.name.replace(/,/g, '');
      fragment.append(createStationElement(slice));
    });
    container.append(fragment);
    ndx += pullNumber;
    loading = false;
  }

  window.addEventListener('resize', _ => {
    const adjusted = getPullCount();
    if (adjusted > pullNumber) {
      pullNumber = adjusted;
      load();
    }
  });

  const parent = container.parentElement;
  const toTop = document.querySelector('.to-top');

  parent.onscroll = _ => {
    if (parent.scrollTop < lastTop) {
      toTop.classList.add('hidden');
    } else if (parent.scrollTop > 0) {
      toTop.classList.remove('hidden');
    } else {
      toTop.classList.add('hidden');
    }
    lastTop = parent.scrollTop;
    if (parent.scrollTop / (parent.scrollHeight - parent.clientHeight) >= 0.8) {
      load();
    }
  };

  load();
}

/**
 * add query string based on length of input value 
 * 
 * @param {String} value
 * 
 * @returns {String}
 */
function queryString(value) {
  return (value.length === 0) ? '' : `?genres=${encodeURIComponent(value)}`;
}

/**
 * lists genres currently in the genre filter datalist element
 * 
 * @returns {Array}
 */
function currentGenres() {
  const options = Array.from(document.querySelector('#genres').querySelectorAll('option'));
  return options.map(element => element.value);
}

/**
 * filter db request by user entered genres
 * 
 * @function
 * 
 * @param {Event} ev 
 * 
 * @returns {void}
 */
async function filterChanged(ev) {
  ev.target.blur();
  const container = document.querySelector('#stations');
  const stationCount = document.querySelector('#station-count');
  const countParent = stationCount.parentElement;
  try {
    countParent.style.display = 'none';
    loadingAnimation(container);
    let storedElements = JSON.parse(localStorage.getItem('selected'));
    if (ev.loadLocal) {
      if (storedElements) {
        const localFragment = document.createDocumentFragment();
        const elements = storedElements.map(createStationElement);
        elements.forEach(el => {
          el.toggleAttribute('selected');
          localFragment.append(el);
        });
        setSelectedCount(elements.length);
        container.append(localFragment);
      }
      await loadGenres();
    }
    const res = await fetch(`${window.location.origin}/stations${queryString(ev.target.value)}`);
    if (res.status !== 200) {
      return;
    }
    const stations = await res.json();
    const selectedElements = Array.from(container.querySelectorAll('li[selected]'))
      .sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
    const selectedUrls = new Set(selectedElements.map(el => el.dataset.url));
    const list = stations.filter(station => !selectedUrls.has(station.url));
    const fragment = document.createDocumentFragment();
    fragment.append(...selectedElements);
    container.scrollTop = 0;
    container.replaceChildren(fragment);
    lazyLoadOnScroll(list, container);
    stationCount.textContent = stations.length;
    countParent.style.removeProperty('display');
    if (ev.target.value.length && !currentGenres().includes(ev.target.value)) {
      await loadGenres();
    }
    if (typeof _paq !== 'undefined' && ev.target.value.length) _paq.push(['trackEvent', 'Filter', ev.target.value || '']);
  } catch (error) {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) loadingEl.remove();
    countParent.style.removeProperty('display');
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Fetch Error', error || 'Could not get Message']);
    console.error('Error fetching stations:', error);
    new Toast('Error fetching stations:', error);
  }
}

/**
 * toggle play / pause states
 * 
 * @function
 * 
 * @returns {void}
 */
function togglePlay() {
  if (player.paused) {
    player.play();
  } else {
    player.pause();
  }
}

/**
 * audio buffering callback
 * 
 * @function
 * 
 * @param {void} _
 *  
 * @returns {void}
 */
player.onwaiting = _ => {
  const icon = document.querySelector('.player>.small-button>svg>path');
  if (!icon) return;
  icon.setAttribute('d', 'M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z');
  icon.parentElement.classList.add('spin');
};

/**
 * audio playing callback
 * 
 * @function
 * 
 * @param {void} _
 *  
 * @returns {void}
 */
player.onplaying = _ => {
  const icon = document.querySelector('.player>.small-button>svg>path');
  if (!icon) return;
  icon.parentElement.classList.remove('spin');
  icon.setAttribute('d', 'M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z');
};

/**
 * audio play back started
 * 
 * @function
 * 
 * @param {void} _
 *  
 * @returns {void}
 */
player.onplay = _ => {
  if (pauseTimer) {
    clearTimeout(pauseTimer);
    pauseTimer = 0;
  }
};

/**
 * audio paused callback
 * 
 * @function
 * 
 * @param {void} _
 *  
 * @returns {void}
 */
player.onpause = _ => {
  pauseTimer = setTimeout(clearPlaying, 10000);
  const icon = document.querySelector('.player>.small-button>svg>path');
  if (!icon) return;
  icon.parentElement.classList.remove('spin');
  icon.setAttribute('d', 'M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z');
};

/**
 * player.currentTime updated
 * 
 * @param {void} _
 * 
 * @returns {void} 
 */
player.ontimeupdate = async _ => {
  const selector = `li[data-url="${player.src}"]`;
  const playing = document.querySelector(selector);

  if (playing && playing.hasAttribute('playing')) return;
  
  const last = document.querySelector('#stations>li[playing]');
  if (last) last.removeAttribute('playing');
  
  if (!playing) return;
  
  playing.toggleAttribute('playing');
  document.querySelector('#name').addEventListener('click', _ => playing.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  }));
};

/**
 * clears interface of playing stream
 * 
 * @function
 * 
 * @returns {void}
 */
function clearPlaying() {
  document.querySelector('.player').removeAttribute('playing');
  const all = document.querySelectorAll('#stations>li');
  all.forEach(el => el.removeAttribute('playing'));
}

/**
 * validate srteam URL is valid url format
 * 
 * @function
 * 
 * 
 * @param {String} url
 * 
 * @returns {Boolean}
 */
function isValidURL(url) {
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  return urlRegex.test(url);
}

/**
 * Handles the form submission event.
 *
 * This function prevents the default form submission behavior, collects the form data,
 * and sends it to the server via a POST request. It then handles the server response,
 * updates the UI accordingly, and manages the form state. In case of an error, it
 * displays an error message and logs the error to the console.
 *
 * @async
 * @function formSubmission
 * @param {Event} ev - The form submission event.
 * 
 * @returns {Promise<void>} - A promise that resolves when the form submission handling is complete.
 * 
 * @throws {Error} - Throws an error if the fetch request fails.
 */
async function formSubmission(ev) {
  ev.preventDefault();

  const fData = new FormData(ev.target);

  try {
    const response = await fetch('/add', {
      method: 'POST',
      body: fData,
    });

    const result = await response.json();
    document.getElementById('response').innerText = result.message;
    new Toast(result.message);
    await sleep(3000);
    const inputElement = document.querySelector('#station-url');
    const submit = document.querySelector('#submit-stream');
    inputElement.value = '';
    document.getElementById('response').innerText = '';
    if (!submit.hasAttribute('disabled')) {
      submit.toggleAttribute('disabled');
    }
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'URL Submission', ev.target.querySelector('input').value || '']);
  } catch (e) {
    document.getElementById('response').innerText = 'An error occurred!';
    console.error('Error:', e);
    if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'Error', e.message || 'Could not get Message']);
  }
}

/**
 * Toggles the activity state of the submit button based on the validity of the URL input.
 *
 * This function selects the input element and the submit button, checks if the URL
 * provided in the input element is valid, and enables or disables the submit button
 * accordingly.
 *
 * @function toggleButtonActivity
 */
function toggleButtonActivity() {
  const inputElement = document.querySelector('#station-url');
  const submit = document.querySelector('#submit-stream');

  if (isValidURL(inputElement.value)) {
    submit.removeAttribute('disabled');
  } else {
    if (!submit.hasAttribute('disabled')) {
      submit.toggleAttribute('disabled');
    }
  }
}

/**
 * Reports a JavaScript error to Matomo and logs it to the console.
 *
 * This function constructs an error message from the provided error details,
 * logs the error to the console, and sends the error message to Matomo if the
 * Matomo tracking array (_paq) is available.
 *
 * @function reportErrorToMatomo
 * 
 * @param {string} message - The error message.
 * @param {string} url - The URL where the error occurred.
 * @param {number} lineNumber - The line number where the error occurred.
 * @param {number} columnNumber - The column number where the error occurred.
 * @param {Error} error - The error object.
 */
function reportErrorToMatomo(message, url, lineNumber, columnNumber, error) {
  var errorMessage = `Error: ${message} at ${url}:${lineNumber}:${columnNumber}`;
  if (typeof _paq !== 'undefined') _paq.push(['trackEvent', 'JavaScript Error', errorMessage || '']);
}

/**
 * An update was installed for the active service worker
 * 
 * @param {Object} newWorker 
 * 
 * @returns {void}
 */
function updateInstalled(newWorker) {
  if (newWorker.state !== 'installed') return;
  if (!navigator.serviceWorker.controller) return;
  new Toast('App updated', 15, _ => newWorker.postMessage({ action: 'skipWaiting' }), 'Press to refresh');
}

/**
 * attempts to check if volume can be changed. 
 * used to hide volume slider on mobile devices.
 * 
 * @param {HTMLElement} volumeElement
 * 
 * @returns {Boolean} 
 */
async function canChangeVol() {
  const initialVolume = player.volume;
  player.volume = 0.1;
  await sleep(100);
  const volumeChanged = player.volume !== initialVolume;
  player.volume = initialVolume;
  return volumeChanged;
}

/**
 * An update was found to the service worker cache
 * 
 * @param {Object} worker
 */
function updateFound(worker) {
  const newWorker = worker.installing;
  newWorker.onstatechange = _ => updateInstalled(newWorker);
}

/**
 * service worker controller changed
 * 
 * @returns {void}
 */
let refreshing = false;
function controllerChange() {
  if (refreshing) return;
  refreshing = true;
  console.log('Controller has changed, reloading the page...');
  window.location.reload(true);
}

/**
 * creates a datalist element
 * 
 * @param {String} str 
 * 
 * @returns {HTMLElement}
 */
function createOption(str) {
  const option = document.createElement('option');
  option.value = str;
  return option;
}

/**
 * loads genres into a datalist element
 */
async function loadGenres() {
  const res = await fetch(`${window.location.origin}/topGenres`);
  if (res.status !== 200) {
    console.error('failed loading genres');
  }
  const jsonData = await res.json()
  const options = jsonData.map(createOption);
  document.querySelector('#genres').replaceChildren(...options);
}

/**
 * dialogs
 */
function addDialogInteractions() {
  const dialogs = document.querySelectorAll('dialog');
  dialogs.forEach(dialog => {
    dialog.addEventListener('click', event => {
      const closeButton = dialog.querySelector('.small-button.close');
      var rect = dialog.getBoundingClientRect();
      var isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        closeButton.classList.add('attention');
        dialog.classList.add('dialog-attention');
        setTimeout(_ => {
          closeButton.classList.remove('attention');
          dialog.classList.remove('dialog-attention');
        }, 750);
      }
    });
  });

  document.querySelectorAll('dialog>.close').forEach(el => {
    el.addEventListener('click', _ => {
      const dialog = el.parentElement;
      if (dialog.id === 'greeting') {
        localStorage.setItem('greeted', '1');
      }
      dialog.close();
    });
  });

  document.querySelector('#info').addEventListener('click', async _ => {
    const depDiv = document.querySelector('#dependencies');
    depDiv.innerHTML = '';
    loadingAnimation(depDiv);
    document.querySelector('#info-dialog').showModal();
    const response = await fetch('/info');
    const dep = await response.json();
    const str = Object.entries(dep).map(([key, value]) => `${escapeHTML(key)}: ${escapeHTML(value)}`).join('<br>');
    depDiv.innerHTML = str;
  });

  const add = document.querySelector('#add');
  const addButton = document.querySelector('#add_button');
  addButton.addEventListener('click', _ => add.showModal());
}

function escapeHTML(str) {
  const div = document.createElement('div');
  if (str) {
    div.textContent = str;
  }
  return div.textContent;
}

/**
 * window loaded
 */
window.onload = async () => {
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.addEventListener('controllerchange', controllerChange);
      const worker = await navigator.serviceWorker.register('/worker.js', { scope: '/' });
      worker.onupdatefound = () => updateFound(worker);
    } catch (error) {
      console.log('ServiceWorker registration failed: ', error);
    }
  }

  addDialogInteractions();
  
  const dlButton = document.querySelector('#download');
  dlButton.addEventListener('click', dlTxt);
  
  const filter = document.querySelector('#filter');
  filter.addEventListener('change', filterChanged);
  filterChanged({ target: filter, loadLocal: true });
  document.querySelector('.reset').addEventListener('click', _ => {
    if (filter.value === '') return;
    filter.value = '';
    filterChanged({ target: filter});
  });
  
  document.querySelector('body').append(player);
  document.querySelector('.player>.small-button').addEventListener('click', togglePlay);

  const wrapper = document.querySelector('.wrapper');
  const toTop = document.querySelector('.to-top');

  toTop.addEventListener('click', _ => wrapper.scrollTo({
    top: 0,
    behavior: 'smooth'
  }));

  const form = document.querySelector('#add-stream');
  form.addEventListener('submit', formSubmission);

  const inputElement = document.querySelector('#station-url');
  inputElement.oninput = toggleButtonActivity;

  if (await canChangeVol()) {
    const slider = document.querySelector('#vol>input');
    slider.value = Number(localStorage.getItem('volume')) || 100;
    player.volume =  slider.value / 100;
    let changeTimer = 0;
    slider.addEventListener('input', _ => {
      player.volume = slider.value / 100;
      if (changeTimer) clearTimeout(changeTimer);
      changeTimer = setTimeout(_ => localStorage.setItem('volume', slider.value), 1000);
    });
  } else {
    const volumeElement = document.querySelector('#vol');
    volumeElement.style.display = 'none';
  }

  window.addEventListener('offline', _ => {
    const playerElement = document.querySelector('.player');
    if (playerElement.hasAttribute('playing')) {
      new Toast('Disconnected: attempting reconnect', 1.5);
    }
  });

  window.addEventListener('online', _ => {
    const playerElement = document.querySelector('.player');
    if (playerElement.hasAttribute('playing')) {
      new Toast('Reconnected: attempting to restart play', 1.5);
      player.play();
    }
  });

  // matomo 
  const alert = document.querySelector('#alert');
  document.querySelector('.alert>.yellow-text').addEventListener('click', async _ => {
    localStorage.setItem('dismissed', '1');
    clearInterval(checkAnalytics);
    alert.removeAttribute('open');
    await sleep(1000);
    alert.remove();
  });

  let dismissed = Number(localStorage.getItem('dismissed'));

  let checkAnalytics = setInterval(_ => {
    const hasChildren = document.querySelectorAll('#matomo-opt-out>*').length;
    if (!hasChildren) return;
    if (dismissed) {
      clearInterval(checkAnalytics);
      alert.remove();
      return;
    }
    if (!alert.hasAttribute('open')) {
      clearInterval(checkAnalytics);
      alert.toggleAttribute('open');
    }
  }, 500);
  // end matomo

  let greeted = Number(localStorage.getItem('greeted'))

  await sleep(100);
  const greeting = document.querySelector('#greeting');
  if (greeted) {
    greeting.remove();
  } else {
    greeting.showModal();
  }
  greeting.addEventListener('transitionend', e => {
    if (greeting.hasAttribute('open')) return;
    greeting.remove();
  });
};


window.onerror = (message, url, lineNumber, columnNumber, error) => {
  reportErrorToMatomo(message, url, lineNumber, columnNumber, error);
  return true;
};