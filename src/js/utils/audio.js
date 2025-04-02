import Toast from '../Toast/Toast.js';
import sleep from './sleep.js';
import debounce from './debounce.js';

const PAUSE_TIMER_DURATION = 10000;
const VOLUME_DEBOUNCE_DURATION = 1000;

/**
 * AudioPlayer class
 */
export default class AudioPlayer {
  constructor() {
    this.player = new Audio();
    this.pauseTimer = 0;

    this.player.onwaiting = this._onwaiting.bind(this);
    this.player.onplaying = this._onplaying.bind(this);
    this.player.onplay = this._onplay.bind(this);
    this.player.onpause = this._onpause.bind(this);
    this.player.ontimeupdate = this._ontimeupdate.bind(this);
    this.player.onerror = _ => {
      const error = this.player.error;
      const message = error ? error.message : 'Unknown error';
      new Toast(`Audio Error: ${message} (Station: ${this.player.dataset.id || 'Unknown'})`, 3);
    };
  }

  /**
   * audio buffering callback
   * 
   * @function
   *  
   * @returns {void}
   */
  _onwaiting() {
    const icon = document.querySelector('.player>.small-button>svg>path');
    if (!icon) return;
    icon.setAttribute('d', 'M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z');
    icon.parentElement.classList.add('spin');
  }

  /**
   * audio playing callback
   * 
   * @function
   *  
   * @returns {void}
   */
  _onplaying() {
    const icon = document.querySelector('.player>.small-button>svg>path');
    if (!icon) return;
    icon.parentElement.classList.remove('spin');
    icon.setAttribute('d', 'M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z');
  }

  /**
   * audio play back started
   * 
   * @function
   *  
   * @returns {void}
   */
  _onplay() {
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = 0;
    }
    const selector = `li[data-url="${this.player.src}"]`;
    this.currentPlayingElement = document.querySelector(selector);
  }

  /**
   * audio paused callback
   * 
   * @function
   *  
   * @returns {void}
   */
  _onpause() {
    this.pauseTimer = setTimeout(this._clearPlaying, PAUSE_TIMER_DURATION);
    const icon = document.querySelector('.player>.small-button>svg>path');
    if (!icon) return;
    icon.parentElement.classList.remove('spin');
    icon.setAttribute('d', 'M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z');
  }

  /**
   * player.currentTime updated
   * 
   * @function
   * 
   * @returns {void} 
   */
  _ontimeupdate() {
    if (this.currentPlayingElement && this.currentPlayingElement.hasAttribute('playing')) return;
    
    const last = document.querySelector('#stations>li[playing]');
    if (last) last.removeAttribute('playing');
    
    if (!this.currentPlayingElement) return;
    
    this.currentPlayingElement.toggleAttribute('playing');
    document.querySelector('#name').addEventListener('click', _ => this.currentPlayingElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    }));
  }

  /**
   * attempts to check if volume can be changed. 
   * used to hide volume slider on mobile devices.
   * 
   * @param {HTMLElement} volumeElement
   * 
   * @returns {Boolean} 
   */
  async _canChangeVol() {
    const initialVolume = this.player.volume;
    this.player.volume = 0.1;
    await sleep(100);
    const volumeChanged = this.player.volume !== initialVolume;
    this.player.volume = initialVolume;
    return volumeChanged;
  }

  /**
   * player volume slider
   * 
   * @function
   * 
   * @returns {void}
   */
  _setVolumeSlider() {
    const slider = document.querySelector('#vol>input');
    slider.value = Number(localStorage.getItem('volume')) || 100;
    this.player.volume = slider.value / 100;

    const saveVolume = debounce(value => {
      localStorage.setItem('volume', value);
    }, VOLUME_DEBOUNCE_DURATION);

    slider.addEventListener('input', _ => {
      this.player.volume = slider.value / 100;
      saveVolume(slider.value);
    });
  }

  /**
   * Toggles the play/pause state of the audio player.
   * 
   * @function
   * @returns {void}
   */
  _togglePlay() {
    if (this.player.paused) {
      this.player.play();
    } else {
      this.player.pause();
    }
  }

  /**
   * play
   * 
   * @param {Object} station
   * @param {String} station.id - The id of the station. 
   * @param {String} station.url - The url of the station.
   * @param {String} station.name - staion's name
   * @param {Number} station.bitrate - streams bitrate
   * 
   * @returns {void} 
   */
  playStream({id, url, name, bitrate}) {
    document.querySelector('#name').textContent = name;
    document.querySelector('#bitrate').textContent = `${bitrate === 0 ? '???' : bitrate}kbps`;
    const miniPlayer = document.querySelector('.player');
    if (!miniPlayer.hasAttribute('playing')) {
      miniPlayer.toggleAttribute('playing');
    }

    this.player.dataset.id = id;
    this.player.src = url;
    this.player.load();
    this.player.play();
  }

  /**
   * clears interface of playing stream
   * 
   * @function
   * 
   * @returns {void}
   */
  _clearPlaying() {
    document.querySelector('.player').removeAttribute('playing');
    const all = document.querySelectorAll('#stations>li');
    all.forEach(el => el.removeAttribute('playing'));
  }

  /**
   * handles offline state
   * 
   * @function
   * 
   * @returns {void}
   */
  _handleOffline() {
    const playerElement = document.querySelector('.player');
    if (playerElement.hasAttribute('playing')) {
      new Toast('Disconnected: attempting reconnect', 1.5);
    }
  }

  /**
   * handles online state
   * 
   * @function
   * 
   * @returns {void}
   */
  _handleOnline() {
    const playerElement = document.querySelector('.player');
    if (playerElement.hasAttribute('playing')) {
      new Toast('Reconnected: attempting to restart play', 1.5);
      this.player.play();
    }
  }

  /**
   * loads player into document
   */
  async load() {
    document.querySelector('body').append(this.player);
    document.querySelector('.player>.small-button').addEventListener('click', this._togglePlay.bind(this));

    const notMobile = await this._canChangeVol();

    if (notMobile) {
      this._setVolumeSlider();
    } else {
      const volumeElement = document.querySelector('#vol');
      volumeElement.style.display = 'none';
    }
  
    window.addEventListener('offline', this._handleOffline.bind(this));
  
    window.addEventListener('online', this._handleOnline.bind(this));
  }
}