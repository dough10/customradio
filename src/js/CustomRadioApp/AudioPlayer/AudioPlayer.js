import Toast from '../Toast/Toast.js';
import sleep from '../utils/sleep.js';
import debounce from '../utils/debounce.js';
import { t } from '../utils/i18n.js';

const PAUSE_TIMER_DURATION = 10000;
const VOLUME_DEBOUNCE_DURATION = 1000;

/**
 * saves volume to local storage
 * 
 * @param {Number} value - volume value
 */
const saveVolume = debounce(value => {
  localStorage.setItem('volume', value);
}, VOLUME_DEBOUNCE_DURATION);

/**
 * AudioPlayer class
 * responsable for managing HTML <audio> element
 * as well as managing UI elements for the audio tag
 */
export default class AudioPlayer {
  _selectors = {
    player: '.player',
    name: '#name',
    bitrate: '#bitrate',
    volume: '#vol',
    smallButton: '.player>.small-button',
    stations: '#stations>li',
    icon: '.player>.small-button>svg>path',
    filter: '#filter',
    info: '#info',
    add: '#add_button',
    downloadButton: '#download'
  };

  constructor() {
    this.player = new Audio();
    this.pauseTimer = 0;
    this._OGTitle = document.title;

    this._interactive = [
      document.querySelector(this._selectors.filter),
      document.querySelector(this._selectors.info),
      document.querySelector(this._selectors.add),
      document.querySelector(this._selectors.downloadButton),
    ];

    this.player.onwaiting = this._onwaiting.bind(this);
    this.player.onplaying = this._onplaying.bind(this);
    this.player.onplay = this._onplay.bind(this);
    this.player.onpause = this._onpause.bind(this);
    this.player.ontimeupdate = this._ontimeupdate.bind(this);

    this._handleOnline = this._handleOnline.bind(this);
    this._handleOffline = this._handleOffline.bind(this)
    this._clearPlaying = this._clearPlaying.bind(this);
    this._togglePlay = this._togglePlay.bind(this);
    this._scrollToStation = this._scrollToStation.bind(this);
    this._setVolume = this._setVolume.bind(this);
    this._onKeyPress = this._onKeyPress.bind(this);

    this._bouncedToggle = debounce(this._togglePlay, 100);

    this.player.onerror = _ => {
      const error = this.player.error;
      const message = error ? error.message : 'Unknown error';
      new Toast(t('playingError', message), 3);
    };
  }

  /**
   * audio buffering callback
   * 
   * @private
   * @function
   *  
   * @returns {void}
   */
  _onwaiting() {
    const icon = document.querySelector(this._selectors.icon);
    if (!icon) return;
    icon.setAttribute('d', 'M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z');
    icon.parentElement.classList.add('spin');
  }

  /**
   * audio playing callback
   * 
   * @private
   * @function
   *  
   * @returns {void}
   */
  _onplaying() {
    const icon = document.querySelector(this._selectors.icon);
    if (!icon) return;
    icon.parentElement.classList.remove('spin');
    icon.setAttribute('d', 'M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z');
  }

  /**
   * audio play back started
   * 
   * @private
   * @function
   *  
   * @returns {void}
   */
  _onplay() {
    document.title = t('playing', document.querySelector(this._selectors.name).textContent);
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = 0;
    }
  }

  /**
   * audio paused callback
   * 
   * @private
   * @function
   *  
   * @returns {void}
   */
  _onpause() {
    document.title = this._OGTitle;
    this.pauseTimer = setTimeout(this._clearPlaying, PAUSE_TIMER_DURATION);
    const icon = document.querySelector(this._selectors.icon);
    if (!icon) return;
    icon.parentElement.classList.remove('spin');
    icon.setAttribute('d', 'M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z');
  }

  /**
   * player.currentTime updated
   * 
   * @private
   * @function
   * 
   * @returns {void} 
   */
  _ontimeupdate() {
    this.currentPlayingElement = document.querySelector(`#stations>li[data-url="${this.player.src}"]`);
    
    // already marked as playing
    if (this.currentPlayingElement && this.currentPlayingElement.hasAttribute('playing')) return;
    
    // unmark last stream
    const last = document.querySelector('#stations>li[playing]');
    if (last) last.removeAttribute('playing');
    
    // playback stopped
    if (!this.currentPlayingElement) return;

    this.currentPlayingElement.toggleAttribute('playing');
  }

  /**
   * scrolls UI to current playing station if in list
   * 
   * @private
   * @function
   * 
   * @returns {void}
   */
  _scrollToStation() {
    if (!this.currentPlayingElement) return;
    this.currentPlayingElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  /**
   * attempts to check if volume can be changed. 
   * used to hide volume slider on mobile devices.
   * 
   * @private
   * @function
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
   * @private
   * @function
   * 
   * @returns {void}
   */
  _setVolumeSlider() {
    const slider = document.querySelector('#vol>input');
    slider.value = Number(localStorage.getItem('volume')) || 100;
    this.player.volume = slider.value / 100;
    slider.addEventListener('input', this._setVolume);
  }

  /**
   * set the volume on change
   * 
   * @private
   * @function
   * 
   * @param {Event} ev 
   */
  _setVolume(ev) {
    const slider = ev.target;
    this.player.volume = slider.value / 100;
    saveVolume(slider.value);
  }

  /**
   * Toggles the play/pause state of the audio player.
   * 
   * @private
   * @function
   * 
   * @returns {void}
   */
  _togglePlay() {
    this.player.paused ? this.player.play() : this.player.pause();
  }

  /**
   * get currently playing info from server
   * @private
   * @function
   * 
   * @param {String} url
   * 
   * @returns {String}
   */
  async _getTrackData(url) {
    if (!url) return;
    try {
      const parsed = new URL(url);
      console.log(parsed);
      const res = await fetch(`${parsed.origin}/currentsong`);
      if (res.status !== 200) return;
      const playing = await res.text();
      if (playing) document.querySelector(this._selectors.name).textContent = playing;
    } catch(e) {
      console.error(`error getting now playing: ${e}`);
    }
  }

  /**
   * play
   * 
   * @public
   * @function
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
    if (!id || !url || !name) {
      console.error('Invalid station data:', { id, url, name, bitrate });
      new Toast(t('invalidStation'), 3);
      return;
    }
    
    document.title = t('playing', name);
    document.querySelector(this._selectors.name).textContent = name;
    document.querySelector(this._selectors.bitrate).textContent = `${bitrate === 0 ? '???' : bitrate}kbps`;
    
    const miniPlayer = document.querySelector(this._selectors.player);
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
   * @private
   * @function
   * 
   * @returns {void}
   */
  _clearPlaying() {
    document.querySelector(this._selectors.player).removeAttribute('playing');
    const allStations = document.querySelectorAll(this._selectors.stations);
    allStations.forEach(el => el.removeAttribute('playing'));
    this.currentPlayingElement = null;
  }

  /**
   * handles offline state
   * 
   * @private
   * @function
   * 
   * @returns {void}
   */
  _handleOffline() {
    const playerElement = document.querySelector(this._selectors.player);
    if (playerElement.hasAttribute('playing')) {
      new Toast(t('offline'), 1.5);
    }
  }

  /**
   * handles online state
   * 
   * @private
   * @function
   * 
   * @returns {void}
   */
  _handleOnline() {
    const playerElement = document.querySelector(this._selectors.player);
    if (playerElement.hasAttribute('playing')) {
      new Toast(t('online'), 1.5);
      this.player.play();
    }
  }

  /**
   * keypress callback function
   * 
   * @private
   * @function
   * @param {Event} ev 
   */
  _onKeyPress(ev) {
    if (this._interactive.includes(document.activeElement)) return;
    const dialogs = Array.from(document.querySelectorAll('dialog'));
    if (dialogs.some(dialog => dialog.open)) return;
    const button = ev.code;
    switch (button) {
      case 'Space': 
        ev.preventDefault();
        if (this.player.src) this._bouncedToggle();
        break;
    }
  }

  /**
   * remove event listeners
   * @public
   * @function
   */
  destroy() {
    window.removeEventListener('offline', this._handleOffline);
  
    window.removeEventListener('online', this._handleOnline);

    window.removeEventListener('keypress', this._onKeyPress);

    document.querySelector(this._selectors.name).removeEventListener('click', this._scrollToStation);

    document.querySelector(this._selectors.smallButton).removeEventListener('click', this._togglePlay);
    
    document.querySelector('#vol>input').removeEventListener('input', this._setVolume);
  }

  /**
   * loads player into document
   * @public
   * @function
   */
  async init() {
    document.querySelector('body').append(this.player);
    
    const notMobile = await this._canChangeVol();
    
    if (notMobile) {
      this._setVolumeSlider();
    } else {
      const volumeElement = document.querySelector(this._selectors.volume);
      volumeElement.style.display = 'none';
    }
    
    window.addEventListener('offline', this._handleOffline);
    
    window.addEventListener('online', this._handleOnline);
    
    window.addEventListener('keypress', this._onKeyPress);
    
    document.querySelector(this._selectors.name).addEventListener('click', this._scrollToStation);

    document.querySelector(this._selectors.smallButton).addEventListener('click', this._togglePlay);
  }
}