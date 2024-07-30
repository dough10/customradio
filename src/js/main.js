import '../css/reset.css';
import '../css/base.css';

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
      this.link = link;
      this.toast.appendChild(this._withLink(message, link, linkText));
    } else {
      this.toast.textContent = message;
    }
    document.querySelector('body').appendChild(this.toast);
    sleep(25).then(_ => requestAnimationFrame(_ => {
      this.toast.style.opacity = 1;
      this.toast.style.transform = 'translateY(0px)';
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
    toast.style.opacity = 0;
    toast.style.transform = 'translateY(80px)';
    toast.style.willChange = 'auto';
    toast.style.transition = 'all 300ms cubic-bezier(.33,.17,.85,1.1) 0ms';
    toast.addEventListener('transitionend', this._transitionEnd, true);
    toast.addEventListener('click', this._clicked, true)
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
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'space-between';
    wrapper.style.alignItems = 'center';
    wrapper.style.overflow = 'none';
    [mText, lText].forEach(el => wrapper.appendChild(el));
    return wrapper;
  }

  /**
   * event handler for toast click
   */
  _clicked(e) {
    if (this.link) {
      window.open(this.link, "_blank");
    }
    // createRipple(e);
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
      if (this.toast) {
        this.toast.remove();
      }
    });
    requestAnimationFrame(_ => {
      this.toast.style.opacity = 0;
      this.toast.style.transform = 'translateY(80px)';
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
 * toggles selected attribute
 * 
 * @param {Event} ev
 * 
 * @returns {void} 
 */
function toggleSelect(ev) {
  const dlButton = document.querySelector('#download');
  const el = ev.target.parentElement;
  el.toggleAttribute('selected')
  const all = el.parentNode.querySelectorAll('li[selected]');
  const count = document.querySelector('#count');
  count.textContent = all.length;
  if (all.length) {
    dlButton.removeAttribute('disabled');
    if (_paq) _paq.push(['trackEvent', 'Button', 'Remove from file', el.dataset.url])
  } else {
    if (!dlButton.hasAttribute('disabled')) {
      dlButton.toggleAttribute('disabled');
      if (_paq) _paq.push(['trackEvent', 'Button', 'Add to file', el.dataset.url]);
    }
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
  return `# created by https://customradio.dough10.me [${formattedDate}] #\n`;
}

/**
 * generates a text file download from selected items
 * 
 * @function
 * 
 * @returns {void}
 */
async function dlTxt() {
  if (_paq) _paq.push(['trackLink', 'radio.txt', 'download']);
  const container = document.querySelector('#stations');
  const elements = Array.from(container.querySelectorAll('li[selected]'));
  const str = elements.map(el => {
    return {
      name: el.title,
      url: el.dataset.url
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(el => `${el.name}, ${el.url}`).join('\n');

  const blob = new Blob([`${stamp()}${str}`], {
    type: 'text/plain'
  });
  const filename = 'radio.txt';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(link.href);
}

/**
 * reset selected elements in UI
 * 
 * @function
 * 
 * @returns {void}
 */
function reset() {
  const container = document.querySelector('#stations');
  const elements = container.querySelectorAll('li[selected]');
  elements.forEach(el => el.removeAttribute('selected'));
}

/**
 * plays stream when button is clicked
 * 
 * @function
 * 
 * @param {Event} ev
 * 
 * @returns {void} 
 */
function playStream(ev) {
  ev.preventDefault();
  const el = ev.target.parentElement;
  const miniPlayer = document.querySelector('.player');
  if (!miniPlayer.hasAttribute('playing')) {
    miniPlayer.toggleAttribute('playing');
  }
  document.querySelector('#name').textContent = el.title;
  new Toast(`Playing ${el.title}`);
  player.src = el.dataset.url;
  player.load();
  player.play();
  if (_paq) _paq.push(['trackEvent', 'Button', 'Play stream', el.dataset.url]);
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
  svg.appendChild(path);
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
  button.appendChild(svgIcon(icon));
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
 * @param {String} station.genre - The genre of the station.
 * 
 * @returns {HTMLElement} li element
 */
function createStationElement({ name, url, genre }) {
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

  // remove default port numbers
  [':80/', ':443/'].forEach(port => {
    url = url.replace(port, '/');
  });

  const buttons = buttonData.map(createSmallButton);

  const span = document.createElement('span');
  span.textContent = name;

  const li = document.createElement('li');
  li.title = name;
  li.dataset.url = url;
  li.dataset.genre = genre;
  [span, ...buttons].forEach(el => li.appendChild(el));
  return li;
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
  let pullNumber = Math.round(window.innerHeight / 58);
  let loading = false;
  let lastTop = 0;
  function load() {
    if (loading || ndx >= list.length) return;
    loading = true;
    const slices = list.slice(ndx, ndx + pullNumber);
    const fragment = document.createDocumentFragment();
    slices.forEach(slice => {
      slice.name = slice.name.replace(/,/g, '');
      fragment.appendChild(createStationElement(slice));
    });
    container.appendChild(fragment);
    ndx += pullNumber;
    loading = false;
  }
  window.addEventListener('resize', _ => {
    const adjusted = Math.round(window.innerHeight / 58);
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
 * filter db request by user entered genres
 * 
 * @function
 * 
 * @param {Event} ev 
 * 
 * @returns {void}
 */
async function filterChanged(ev) {
  try {
    const res = await fetch(`${window.location.origin}/stations?genres=${ev.target.value}`);
    if (res.status !== 200) {
      return;
    }
    const stations = await res.json();
    const container = document.querySelector('#stations');
    const selectedElements = Array.from(container.querySelectorAll('li[selected]'));
    const selectedUrls = new Set(selectedElements.map(el => el.dataset.url));
    const list = stations.filter(station => !selectedUrls.has(station.url));
    const fragment = document.createDocumentFragment();
    selectedElements.forEach(el => fragment.appendChild(el));
    container.innerHTML = '';
    container.scrollTop = 0;
    container.appendChild(fragment);
    lazyLoadOnScroll(list, container);
    document.querySelector('#station-count').textContent = stations.length;
    if (_paq) _paq.push(['trackEvent', 'Filter', 'Genre', ev.target.value]);
  } catch (error) {
    if (_paq) _paq.push(['trackEvent', 'Fetch Error', 'Error', error]);
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
  if (pauseTimer) {
    clearTimeout(pauseTimer);
    pauseTimer = 0;
  }
  const icon = document.querySelector('.player>.small-button>svg>path');
  if (!icon) return;
  icon.parentElement.classList.remove('spin');
  icon.setAttribute('d', 'M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z');
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
  const last = document.querySelector('#stations>li[playing]');
  if (last) last.removeAttribute('playing');
  const selector = `li[data-url="${player.src}"]`;
  const playing = document.querySelector(selector);
  if (!playing) console.log(playing, selector);
  if (playing && !playing.hasAttribute('playing')) {
    playing.toggleAttribute('playing');
  }
};


window.onload = async _ => {
  document.querySelectorAll('dialog>.close').forEach(el => {
    el.addEventListener('click', _ => el.parentElement.close());
  });

  const add = document.querySelector('#add');
  const addButton = document.querySelector('#add_button');
  addButton.addEventListener('click', _ => add.showModal());

  const dlButton = document.querySelector('#download');
  dlButton.addEventListener('click', dlTxt);

  const filter = document.querySelector('#filter');
  filter.addEventListener('change', filterChanged);
  filterChanged({ target: filter });

  document.querySelector('body').appendChild(player);
  document.querySelector('.player>.small-button').addEventListener('click', togglePlay);

  const wrapper = document.querySelector('.wrapper');
  const toTop = document.querySelector('.to-top');

  toTop.addEventListener('click', _ => wrapper.scrollTo({
    top: 0,
    behavior: 'smooth'
  }));

  await sleep(100);
  document.querySelector('#greeting').showModal();
};

function reportErrorToMatomo(message, url, lineNumber, columnNumber, error) {
  console.error(error);
  var errorMessage = `Error: ${message} at ${url}:${lineNumber}:${columnNumber}`;
  if (_paq) _paq.push(['trackEvent', 'JavaScript Error', 'Error', errorMessage]);
}

// Attach the function to the global error handler
window.onerror = function(message, url, lineNumber, columnNumber, error) {
  reportErrorToMatomo(message, url, lineNumber, columnNumber, error);
  return true;
};