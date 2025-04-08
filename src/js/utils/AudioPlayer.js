import Toast from '../Toast/Toast.js';
import sleep from './sleep.js';
import debounce from './debounce.js';

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
 */
export default class AudioPlayer {
  _selectors = {
    player: '.player',
    name: '#name',
    bitrate: '#bitrate',
    volume: '#vol',
    smallButton: '.player>.small-button',
    stations: '#stations>li',
    icon: '.player>.small-button>svg>path'
  };

  constructor() {
    this.player = new Audio();
    this.pauseTimer = 0;

    this.player.onwaiting = this._onwaiting.bind(this);
    this.player.onplaying = this._onplaying.bind(this);
    this.player.onplay = this._onplay.bind(this);
    this.player.onpause = this._onpause.bind(this);
    this.player.ontimeupdate = this._ontimeupdate.bind(this);
    this._togglePlay = this._togglePlay.bind(this);
    this._scrollToStation = this._scrollToStation.bind(this);
    this._setVolume = this._setVolume.bind(this);
    this._onKeyPress = this._onKeyPress.bind(this);

    this._bouncedToggle = debounce(this._togglePlay, 100);

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
    const icon = document.querySelector(this._selectors.icon);
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
    const icon = document.querySelector(this._selectors.icon);
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
    const icon = document.querySelector(this._selectors.icon);
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
    this.currentPlayingElement = document.querySelector(`#stations>li[data-url="${this.player.src}"]`);

    if (this.currentPlayingElement && this.currentPlayingElement.hasAttribute('playing')) return;
    
    const last = document.querySelector('#stations>li[playing]');
    if (last) last.removeAttribute('playing');
    
    if (!this.currentPlayingElement) return;
    
    this.currentPlayingElement.toggleAttribute('playing');
  }

  _scrollToStation() {
    this.currentPlayingElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
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
    slider.addEventListener('input', this._setVolume);
  }

  /**
   * set the volume on change
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
   * get currently playing info from server
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
      new Toast('Invalid station data. Unable to play stream.', 3);
      return;
    }

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
   * @function
   * 
   * @returns {void}
   */
  _handleOffline() {
    const playerElement = document.querySelector(this._selectors.player);
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
    const playerElement = document.querySelector(this._selectors.player);
    if (playerElement.hasAttribute('playing')) {
      new Toast('Reconnected: attempting to restart play', 1.5);
      this.player.play();
    }
  }

  /**
   * keypress callback function
   * 
   * @param {Event} ev 
   */
  _onKeyPress(ev) {
    ev.preventDefault();
    const button = ev.code;
    switch (button) {
      case 'Space': 
        if (this.player.src) this._bouncedToggle();
        break;
    }
  }

  /**
   * remove event listeners
   */
  destroy() {
    window.removeEventListener('offline', this._handleOffline.bind(this));
  
    window.removeEventListener('online', this._handleOnline.bind(this));

    window.removeEventListener('keypress', this._onKeyPress);

    document.querySelector(this._selectors.name).removeEventListener('click', this._scrollToStation);

    document.querySelector(this._selectors.smallButton).removEventListener('click', this._togglePlay);
    
    document.querySelector('#vol>input').removeEventListener('input', this._setVolume);
  }

  /**
   * loads player into document
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
    
    window.addEventListener('offline', this._handleOffline.bind(this));
    
    window.addEventListener('online', this._handleOnline.bind(this));
    
    window.addEventListener('keypress', this._onKeyPress);
    
    document.querySelector(this._selectors.name).addEventListener('click', this._scrollToStation);

    document.querySelector(this._selectors.smallButton).addEventListener('click', this._togglePlay);
  }
}