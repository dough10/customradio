import Toast from '../Toast/Toast.js';
import sleep from '../utils/sleep.js';
import debounce from '../utils/debounce.js';
import { t } from '../utils/i18n.js';
import hapticFeedback from '../utils/hapticFeedback.js';

const PAUSE_TIMER_DURATION = 10000;
const VOLUME_DEBOUNCE_DURATION = 1000;
const PLAY_DEBOUNCE_DURATION = 100;

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

  constructor(notifications = null) {
    this.player = new Audio();
    this.pauseTimer = 0;
    this._OGTitle = document.title;
    this._notifications = notifications;

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
    this.player.onerror = _ => {
      const error = this.player.error;
      const message = error ? error.message : 'Unknown error';
      new Toast(t('playingError', message), 3);
    };
    
    // bind functions
    this._handleOnline = this._handleOnline.bind(this);
    this._handleOffline = this._handleOffline.bind(this)
    this._clearPlaying = this._clearPlaying.bind(this);
    this._togglePlay = this._togglePlay.bind(this);
    this._scrollToStation = this._scrollToStation.bind(this);
    this._setVolume = this._setVolume.bind(this);
    this._onKeyPress = this._onKeyPress.bind(this);

    // debounced
    this._bouncedToggle = debounce(this._togglePlay, PLAY_DEBOUNCE_DURATION);

    this._saveVolume = debounce(value => {
      localStorage.setItem('volume', value);
    }, VOLUME_DEBOUNCE_DURATION);
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
   * ensures that the current playing station is marked as such
   * and mini player is marked as playing
   * 
   * @private
   * @function
   * 
   * @returns {void} 
   */
  _ontimeupdate() {
    const miniPlayer = document.querySelector(this._selectors.player);
    if (!miniPlayer.hasAttribute('playing')) {
      miniPlayer.toggleAttribute('playing');
    }

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
   * hides volume slider when user is on mobile device
   */
  _hideVolumeSlider() {
    const volumeElement = document.querySelector(this._selectors.volume);
    volumeElement.style.display = 'none';
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
    this._saveVolume(slider.value);
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
    hapticFeedback();
    this.player.paused ? this.player.play() : this.player.pause();
  }

  /**
   * default metadata for Media Session API
   * 
   * @private
   * @function
   * @param {Object} station - The station object containing metadata.
   * @param {String} station.name - The name of the station.
   * @param {String} station.bitrate - The bitrate of the station.
   * 
   * @return {Object} - Default metadata object for the Media Session API.
   * @example
   * _defaultMetadata({ name: 'My Station', bitrate: 128 });
   * // Returns:
   * // {
   * //   title: 'My Station - 128kbps',
   * //   artist: 'customradio.dough10.me',
   * //   album: 'Live Stream',
   * //   artwork: [
   * //     { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
   * //     { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
   * //   ],
   * // }
   */
  _defaultMetadata({ name, bitrate }) {
    return {
      title: `${name} - ${bitrate === 0 ? '???' : bitrate}kbps`,
      artist: location.host,
      album: 'Live Stream',
      artwork: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    };
  }

  /**
   * Updates the Media Session API metadata and action handlers.
   * 
   * @private
   * @function
   * 
   * @param {Object} station - The station object containing metadata.
   * @param {String} station.name - The name of the station.
   * @param {Number} station.bitrate - The bitrate of the station.
   */
  _updateMediaSession(station) {
    if (!('mediaSession' in navigator)) return;

    // Set media metadata
    navigator.mediaSession.metadata = new MediaMetadata(this._defaultMetadata(station));

    // Set media session action handlers
    navigator.mediaSession.setActionHandler('play', () => this.player.play());
    navigator.mediaSession.setActionHandler('pause', () => this.player.pause());
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

    this._updateMediaSession({ name, bitrate });

    if (!this._notifications) return;
    this._notifications.requestPermission();
    this._notifications.nowPlaying(name);
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
      this.player.load();
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
    switch (ev.code) {
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
    
    notMobile ? this._setVolumeSlider() : this._hideVolumeSlider();
    
    window.addEventListener('offline', this._handleOffline);
    
    window.addEventListener('online', this._handleOnline);
    
    window.addEventListener('keypress', this._onKeyPress);
    
    document.querySelector(this._selectors.name).addEventListener('click', this._scrollToStation);

    document.querySelector(this._selectors.smallButton).addEventListener('click', this._togglePlay);
  }
}