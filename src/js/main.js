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


function selectEl(ev) {
  const dlButton = document.querySelector('#download');
  const el = ev.target;
  el.toggleAttribute('selected')
  const all = el.parentNode.querySelectorAll('li[selected]');
  const count = document.querySelector('#count');
  count.textContent = all.length;
  if (all.length) {
    dlButton.removeAttribute('disabled');
  } else {
    if (!dlButton.hasAttribute('disabled')) {
      dlButton.toggleAttribute('disabled');
    }
  }
}


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
  const dlButton = document.querySelector('#download');
  if (dlButton.hasAttribute('disabled')) return;
  const container = document.querySelector('#stations');
  const elements = Array.from(container.querySelectorAll('li[selected]'));
  const selected = elements.map(el => {
    return {
      name: el.textContent,
      url: el.dataset.url
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const str = selected.map(el => `${el.name}, ${el.url}`);
  const blob = new Blob([
    `${stamp()}${str.join('\n')}`
  ], {
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


function context(ev) {
  ev.preventDefault();
  const miniPlayer = document.querySelector('.player');
  if (!miniPlayer.hasAttribute('playing')) {
    miniPlayer.toggleAttribute('playing');
  }
  document.querySelector('#name').textContent = ev.target.textContent;
  player.src = ev.target.dataset.url;
  player.load();
  player.play();
}

/**
 * load more stations to the UI when user scrolls to end of loaded content
 * 
 * @function
 * 
 * @param {Array} list 
 * @param {HTMLElement} scrollEl
 * 
 * @returns {void} 
 */
function lazyLoadOnScroll(list, scrollEl) {
  let ndx = 0;
  let pullNumber = 25;
  let loading = false;
  function load() {
    if (loading || ndx >= list.length) return;
    loading = true;
    const slices = list.slice(ndx, ndx + pullNumber);
    const fragment = document.createDocumentFragment();
    slices.forEach(slice => {
      const el = document.createElement('li');
      el.textContent = slice.name.replace(/,/g, '');
      el.dataset.url = slice.url;
      el.dataset.genre = slice.genre;
      el.addEventListener('click', selectEl);
      el.addEventListener('contextmenu', context);
      fragment.appendChild(el);
    });
    scrollEl.appendChild(fragment);
    ndx += pullNumber;
    loading = false;
  }
  scrollEl.onscroll = _ => {
    if (scrollEl.scrollTop / (scrollEl.scrollHeight - scrollEl.clientHeight) >= 0.9) {
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
    document.querySelector('#station-count').textContent = stations.length;
    const container = document.querySelector('#stations');
    const selectedElements = Array.from(container.querySelectorAll('li[selected]'));
    const selectedUrls = new Set(selectedElements.map(el => el.dataset.url));
    container.innerHTML = '';
    selectedElements.forEach(el => container.appendChild(el));
    const notSelected = stations.filter(station => !selectedUrls.has(station.url));
    const list = notSelected.sort((a, b) => a.name.localeCompare(b.name));
    lazyLoadOnScroll(list, container);
    container.scrollTop = 0;
  } catch (error) {
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
 * audio paused callback
 * 
 * @function
 * 
 * @param {void} _
 *  
 * @returns {void}
 */
player.onpause = _ => {
  pauseTimer = setTimeout(_ => {
    document.querySelector('.player').removeAttribute('playing');
  }, 30000);
  const icon = document.querySelector('.player>.small-button>svg>path');
  if (!icon) return;
  icon.parentElement.classList.remove('spin');
  icon.setAttribute('d', 'M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z');
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

  await sleep(100);
  document.querySelector('#greeting').showModal();
};