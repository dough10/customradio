import Toast from '../../Toast/Toast.js';
import EventManager from '../../EventManager/EventManager.js';
import Notifications from '../../Notifications/Notifications.js';
import PlayReporter from './PlayReporter/PlayReporter.js';

import sleep from '../../utils/sleep.js';
import debounce from '../../utils/debounce.js';
import { t } from '../../utils/i18n.js';
import hapticFeedback from '../../utils/hapticFeedback.js';
import selectors from '../../selectors.js';

const PAUSE_TIMER_DURATION = 10000;
const VOLUME_DEBOUNCE_DURATION = 1000;
const PLAY_DEBOUNCE_DURATION = 100;

/**
 * AudioPlayer class
 * responsable for managing HTML <audio> element
 * as well as managing UI elements for the audio tag
 */
export default class AudioPlayer {
  /** @type {Number} used to UI pause timeout (ui is hidden) */
  pauseTimer = 0;
  
  /** @type {String} page original title */
  _OGTitle = document.title;

  constructor(notifications = null) {
    this.$icon = document.querySelector(selectors.icon);
    this.$playerElement = document.querySelector(selectors.player);
    this.$name = document.querySelector(selectors.name);
    this.$smallButton = document.querySelector(selectors.smallButton);

    const required = [
      this.$icon,
      this.$playerElement,
      this.$name,
      this.$smallButton,
    ];

    if (required.some(el => !el)) {
      throw new Error("Initialization failed — missing DOM elements.");
    }

    this._bindUtilityFunctions();

    this.$player = new Audio();
    this._bindPlayerEvents();
    
    this._notifications = notifications || new Notifications();
    this._em = new EventManager();
    
    this._bouncedToggle = debounce(this._togglePlay, PLAY_DEBOUNCE_DURATION);
    this._saveVolume = debounce(value => localStorage.setItem('volume', value), VOLUME_DEBOUNCE_DURATION);
  
    setTimeout(_ => this._offerResume(), 1000);
  }

  /**
   * returns the current playing element in the UI
   * 
   * @private
   * @returns {HTMLElement|null}
   */
  get $currentPlayingElement() {
    return document.querySelector(selectors.playingURL(this.$player.src));
  }
  
  /**
   * Offers the user to resume the last played station
   * 
   * @private
   * @function
   * 
   * @returns {Void}
   */
  _offerResume() {
    const lastPlayed = localStorage.getItem('lastStation');
    if (!lastPlayed) return;

    const station = document.querySelector(selectors.lastPlayedURL(lastPlayed));
    if (!station) return;
    
    const stationName = station.parentElement.dataset.name;
    new Toast(
      t('lastPlayedStation', stationName),
      5, 
      _ => station.click(), 
      t('resume')
    );
  }

  /**
   * checks if the element is currently focused
   * 
   * @private
   * @function
   * 
   * @param {HTMLElement} element 
   * 
   * @returns {Boolean}
   */
  _isInteractive(element) {
    const _selectors = [
      selectors.filter,
      selectors.infoButton,
      selectors.add,
      selectors.downloadButton,
    ];
    return _selectors.some(selector => document.querySelector(selector) === element);
  }

  /**
   * binds player events to the audio player
   * 
   * @private
   * @function
   * 
   * @returns {void}
   */
  _bindPlayerEvents() {
    this.$player.onwaiting = this._onwaiting.bind(this);
    this.$player.onplaying = this._onplaying.bind(this);
    this.$player.onplay = this._onplay.bind(this);
    this.$player.onpause = this._onpause.bind(this);
    this.$player.ontimeupdate = this._ontimeupdate.bind(this);
    this.$player.onerror = this._playingError.bind(this);
  }

  /**
   * handles audio playback errors
   * 
   * @private
   * @function
   */
  _playingError() {
    const code = this.$player.error?.code;
    const msg = {
      1: 'MEDIA_ERR_ABORTED',
      2: 'MEDIA_ERR_NETWORK',
      3: 'MEDIA_ERR_DECODE',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
    }[code] || 'Unknown error';
    new Toast(t('playingError', msg), 3);
  }

  /**
   * binds utility functions to the class instance
   * 
   * @private
   * @function
   * 
   * @returns {void}
   */
  _bindUtilityFunctions() {
    this._handleOnline = this._handleOnline.bind(this);
    this._handleOffline = this._handleOffline.bind(this);
    this._clearPlaying = this._clearPlaying.bind(this);
    this._togglePlay = this._togglePlay.bind(this);
    this._scrollToStation = this._scrollToStation.bind(this);
    this._setVolume = this._setVolume.bind(this);
    this._onKeyPress = this._onKeyPress.bind(this);
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
    this.$icon.setAttribute('d', 'M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z');
    this.$icon.parentElement.classList.add('spin');
    this._reporter?.pause();
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
    this.$icon.parentElement.classList.remove('spin');
    this.$icon.setAttribute('d', 'M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z');
    this._reporter?.resume();
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
    document.title = t('playing', this.$name.textContent);
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = 0;
    }
    this._reporter?.resume();
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
    this.$icon.parentElement.classList.remove('spin');
    this.$icon.setAttribute('d', 'M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z');
    this._reporter?.pause();
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
    !this.$playerElement?.hasAttribute('playing') ? this.$playerElement?.toggleAttribute('playing') : null;
 
    const currentPlayingElement = this.$currentPlayingElement;

    // already marked as playing
    if (currentPlayingElement && currentPlayingElement.hasAttribute('playing')) return;
    
    // unmark last stream
    const last = document.querySelector(selectors.playingStation);
    if (last) last.removeAttribute('playing');
    
    // playback stopped
    if (!currentPlayingElement) return;

    currentPlayingElement.toggleAttribute('playing');
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
    const currentPlayingElement = this.$currentPlayingElement;
    if (!currentPlayingElement) return;
    currentPlayingElement.scrollIntoView({
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
    const initialVolume = this.$player.volume;
    this.$player.volume = 0.1;
    await sleep(100);
    const volumeChanged = this.$player.volume !== initialVolume;
    this.$player.volume = initialVolume;
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
    const slider = document.querySelector(selectors.volumeSlider);
    slider.value = localStorage.getItem('volume') ?? 100;
    this.$player.volume = slider.value / 100;
    this._em.add(slider, 'input', this._setVolume, true);
  }

  /**
   * hides volume slider when user is on mobile device
   */
  _hideVolumeSlider() {
    const volumeElement = document.querySelector(selectors.volume);
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
    this.$player.volume = slider.value / 100;
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
    this.$player.paused ? this.$player.play() : this.$player.pause();
  }

  /**
   * default metadata for Media Session API
   * 
   * @private
   * @function
   * 
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
  _metadata({ name, bitrate }) {
    return {
      title: `${name} - ${bitrate === 0 ? '???' : bitrate}kbps`,
      artist: location.host,
      album: 'Live Stream',
      artwork: [
        { 
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        { 
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
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
    navigator.mediaSession.metadata = new MediaMetadata(this._metadata(station));

    // Set media session action handlers
    navigator.mediaSession.setActionHandler('play', () => this.$player.play());
    navigator.mediaSession.setActionHandler('pause', () => this.$player.pause());
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
   * @param {String} station.name - station's name
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
    this.$name.textContent = name;
    document.querySelector(selectors.bitrate).textContent = `${bitrate === 0 ? '???' : bitrate}kbps`;

    !this.$playerElement.hasAttribute('playing') ? this.$playerElement.toggleAttribute('playing') : null;

    this.$player.dataset.id = id;
    this.$player.src = url;
    this.$player.load();
    this.$player.play();

    this._updateMediaSession({ name, bitrate });

    localStorage.setItem('lastStation', url);

    if (this._reporter) this._reporter.destroy();
    this._reporter = new PlayReporter(id);

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
    this.$playerElement.removeAttribute('playing');
    const allStations = document.querySelectorAll(selectors.stations);
    allStations.forEach(el => el.removeAttribute('playing'));
    this.currentPlayingElement = null;
    if (this._reporter) this._reporter.playStopped();
    localStorage.removeItem('lastStation');
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
    if (!this.$playerElement.hasAttribute('playing')) return;
    new Toast(t('offline'), 1.5);
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
    if (!this.$playerElement.hasAttribute('playing')) return;
    new Toast(t('online'), 1.5);
    this.$player.src = this.$player.src;
    this.$player.load();
    this.$player.play();
  }

  /**
   * keypress callback function
   * 
   * @private
   * @function
   * 
   * @param {Event} ev 
   */
  _onKeyPress(ev) {
    if (this._isInteractive(document.activeElement)) return;
    const dialogs = Array.from(document.querySelectorAll('dialog'));
    if (dialogs.some(dialog => dialog.open)) return;
    switch (ev.code) {
      case 'Space': 
        ev.preventDefault();
        if (this.$player.src) this._bouncedToggle();
        break;
    }
  }

  /**
   * remove event listeners
   * 
   * @public
   * @function
   */
  destroy() {
    this._em.removeAll();

    this._reporter?.destroy();
    
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
    }    
  }

  /**
   * loads player into document
   * 
   * @public
   * @function
   */
  async init() {
    document.querySelector('body').append(this.$player);
    
    this._notMobile = await this._canChangeVol();
    
    this._notMobile ? this._setVolumeSlider() : this._hideVolumeSlider();

    this._em.add(window, 'offline', this._handleOffline);
    this._em.add(window, 'online', this._handleOnline);
    this._em.add(window, 'keypress', this._onKeyPress);
    this._em.add(this.$name, 'click', this._scrollToStation);
    this._em.add(this.$smallButton, 'click', this._togglePlay);
  }
}