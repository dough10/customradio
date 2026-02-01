/**
 * @file selectors.js
 * @description Contains all the selectors used in the Custom Radio App.
 * * This file is part of the Custom Radio App project.
 * * It defines a set of selectors that are used to interact with the DOM elements of the application.
 * 
 * @typedef {Object} Selectors
 * @property {String} header - The header element.
 * @property {String} formGroup - The container for input elements.
 * @property {String} filter - The main page input element for filtering stations.
 * @property {String} genres - The genres datalist element.
 * @property {String} resetButton - The filter reset button.
 * @property {String} infoButton - The site info button.
 * @property {String} main - The main page content.
 * @property {String} stationCount - The station count display.
 * @property {String} stationsContainer - The station list container (i.e. ui>li).
 * @property {String} toTop - The scroll to top button.
 * @property {String} downloadButton - The download button.
 * @property {String} loading - The loading indicator.
 * @property {String} player - The site mini player.
 * @property {String} name - The playing station name.
 * @property {String} bitrate - The playing station's bitrate.
 * @property {String} volume - The wrapper containing volume controls.
 * @property {String} volumeSlider - The volume slider input element.
 * @property {String} smallButton - The mini player's play/pause button.
 * @property {String} icon - The mini player play/pause button icon.
 * @property {String} stations - Query selector for all stations.
 * @property {String} add - The add station floating action button.
 * @property {Function} playingURL - Function to find a station by its data-url attribute.
 * @property {String} playingStation - The station marked as playing.
 * @property {String} selectedStation - All selected stations.
 * @property {String} stationUrl - The station URL input element.
 * @property {String} stationSubmit - The station submit button.
 * @property {String} stationSubmitForm - The add station dialog form.
 * @property {String} response - The add station response container.
 * @property {String} dependencies - The application dependencies container.
 * @property {String} greeting - The application greeting.
 * @property {String} smallDialogCloseButton - The small dialog close button.
 * @property {String} dialogCloseButton - The dialog close button.
 * @property {String} dialogClose - All dialog close buttons.
 * @property {String} changelog - The changelog.
 * @property {String} login - The login button.
 * @property {String} logout - The logout button.
 * @property {String} sharelink - The clipboard link button.
 * @property {String} shareDialog - The share dialog.
 * @property {String} emailShare - The email share button.
 * @property {String} smsShare - The SMS share button.
 * @property {String} shareInput - The share link input.
 * @property {String} shareMessage - The share message.
 * @property {String} copyLink - The copy link button.
 * @property {String} userMenuButton - The nav button.
 * @property {String} userMenu - The user menu.
 * @property {String} userAvatar - The user avatar.
 * @property {String} fbShare - The Facebook share button.
 * @property {String} twitterShare - The Twitter share button.
 * 
 * @module Selectors
 */
const selectors = {
  /** @type {String} header element */
  header: 'body>header',

  /** @type {String} container for input elements */
  formGroup: '.form-group',

  /** @type {String} main page input element for filtering stations */
  filter: '#filter',

  /** @type {String} genres datalist element */
  genres: '#genres',

  /** @type {String} filter reset button */
  resetButton: '.reset',

  /** @type {String} site info button */
  infoButton: '#info',

  /** @type {String} site info dialog */
  infoDialog: '#info-dialog',

  /** @type {String} generic dialog element */
  dialog: 'dialog',

  /** @type {String} main page content */
  main: 'main',

  /** @type {String} station count display */
  stationCount: '#station-count',

  /** @type {String} station list container (i.e. ui>li) */
  stationsContainer: '#stations',

  /** @type {String} scroll to top button */
  toTop: '.to-top',

  /** @type {String} download button */
  downloadButton: '#download',

  /** @type {String} loading indicator */
  loading: '.loading',

  /** @type {String} site mini player */
  player: '.player',

  /** @type {String} playing station name */
  name: '#name',

  /** @type {String} playing stations bitrate */
  bitrate: '#bitrate',

  /** @type {String} wrapper containing volume controls */
  volume: '#vol',

  /** @type {String} volume slider input element */
  volumeSlider: '#vol>input',

  /** @type {String} miniplayers play pause button */
  smallButton: '.player>.small-button',

  /** @type {String} mini player play pause button icon */
  icon: '.player>.small-button>svg>path',

  /** @type {String} queryselector for all stations */
  stations: '#stations>li',

  /** @type {String} add station floating action button */
  add: '#add_button',

  /** @type {String} add station dialog */
  addDialog: '#add',

  /** @type {Function} find a station by it's data-url attribute */
  playingURL: url => `#stations>li[data-url="${url}"]`,

  /** @type {Function} find a station's playbutton by it's data-url attribute */
  lastPlayedURL: url => `#stations>li[data-url="${url}"]>.play`,

  /** @type {String} find the station marked as playing */
  playingStation: '#stations>li[playing]',

  /** @type {String} all selected stations */
  selectedStation: '#stations>li[selected]',

  /** @type {String} station url input element */
  stationUrl: '#station-url',

  /** @type {String} station submit button */
  stationSubmit: '#submit-stream',

  /** @type {String} add station dialog form */
  stationSubmitForm: '#add-stream',

  /** @type {String} add station response container */
  response: '#response',

  /** @type {String} application dependencies container */
  dependencies: '#dependencies',

  /** @type {String} application greeting */
  greeting: '#greeting',

  /** @type {String} small dialog close button */
  smallDialogCloseButton: '.small-button.close',

  /** @type {String} dialog close button */
  dialogCloseButton: '.button.close',

  /** @type {String} all dialog close buttons */
  dialogClose: '.close',

  /** @type {String} changelog */
  changelog: '#changelog',

  /** @type {String} login */
  login: 'nav>button[title="login"]',

  /** @type {String} login */
  logout: 'nav>button[title="logout"]',

  /** @type {String} clipboard link button */
  sharelink: 'nav>button[title="share"]',

  /** @type {String} share dialog */
  shareDialog: '#linkshare',

  /** @type {String} email share button */
  emailShare: '#emailshare',

  /** @type {String} sms share button */
  smsShare: '#smsshare',

  /** @type {String} share link input */
  shareInput: '#linkshare-input',

  /** @type {String} share message */
  shareMessage: '#linkshare-message',

  /** @type {String} copy link button */
  copyLink: '#copy-link',

  /** @type {String} nav button */
  userMenuButton: '#login',

  /** @type {String} user menu */
  userMenu: 'nav',

  /** @type {String} user avatar */
  userAvatar: '.avatar-wrapper',

  /** @type {String} facebook share button */
  fbShare: '#facebookshare',

  /** @type {String} twitter share button */
  twitterShare: '#twittershare',

  /** @type {String} first name input */
  firstname: '.firstname',

  /** @type {String} last name input */
  lastname: '.lastname',

  /** @type {String} selected visibility toggle */
  toggleSelected: '#toggle-selected',
};

export default selectors;