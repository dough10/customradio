import EventManager from "../../EventManager/EventManager.js";
import selectors from "../../selectors.js";

const MOBILE_THRESHOLD = 450;

/**
 * Class representing a scroll-responsive collapsing header.
 * Shrinks the header and adjusts element visibility based on scroll position,
 * with mobile-responsive adjustments for better UX on smaller screens.
 */
export default class CollapsingHeader {
  /** @private @type {Number} Maximum amount to shrink the header by (in px) */
  _shrinkHeaderBy = 64;

  /**
   * @private
   * @type {Number}
   * Controls how fast the header collapses.
   * (scrollTop / factor = shrink amount in px)
   */
  _factor = 5;

  /**
   * @private
   * @type {Number}
   * ammount of header that needs to be hidden before info button begins to fade in
   */
  _mobileInfoFadeDelay = 32;

  /**
   * @private
   * @type {Number}
   * extra dappener for header collapse when on mobile
   */
  _mobileMultiplier = 1.5;

  /**
   * @private
   * @type {Number}
   * dappening factor for info button transition
   */
  _infoTranslateFactor = 1.5; // the 1.5 seems to land the info button center of the collapsed header

  /**
   * @private
   * @type {EventManager}
   * Event manager for handling events
   */
  _em = new EventManager();

  constructor() {
    /** @type {HTMLElement|null} Header element */
    this.header = document.querySelector(selectors.header);

    /** @type {HTMLElement|null} Input container element */
    this.input = document.querySelector(selectors.formGroup);
    
    /** @type {HTMLElement|null} Main content wrapper */
    this.main = document.querySelector(selectors.main);
    
    /** recalculate header on window resize */
    this._em.add(window, 'resize', this._onResize.bind(this));
  }
  
  /** @type {HTMLElement|null} Info button element */
  get infoButton() {
    return document.querySelector(selectors.infoButton);
  }
  
  /** @type {HTMLElement|null} login button element */
  get loginButton() {
    return document.querySelector(selectors.userMenuButton);
  }
  
  /** @type {Boolean} mobile device */
  get _isMobile() {
    return window.innerWidth < MOBILE_THRESHOLD;
  }

  /**
   * @private
   * @function
   * recalculates header transition effects on window resize
   */
  _onResize() {
    this.scroll(this.main?.scrollTop || 0);
  }

  /**
   * @public
   * @function
   * remove resize event listener
   */
  destroy() {
    this._em.removeAll();
  }

  /**
   * Calculates the transform distance and opacity based on scroll position.
   * Values are adjusted for mobile screens for smoother behavior.
   *
   * @private
   * @function
   * @param {number} scrollTop - Current vertical scroll position.
   * @returns {{ transform: number, opacity: number }} Object containing calculated values.
   */
  _calculateAnimation(scrollTop) {
    const factor = this._isMobile ? this._factor * this._mobileMultiplier : this._factor;
    const transform = Math.min(scrollTop / factor, this._shrinkHeaderBy);
    return {
      transform,
      opacity: transform / this._shrinkHeaderBy
    };
  }

  /**
   * calculate opacity for info button based on ammount of header hidden
   * 
   * @private
   * @function
   * @param {Number} transform 
   * 
   * @returns {Number}
   */
  _mobileOpacity(transform) {
    const adjustedOpacity = (transform - this._mobileInfoFadeDelay) / (this._shrinkHeaderBy - this._mobileInfoFadeDelay);
    return Math.max(0, Math.min(1, adjustedOpacity));
  }

  /**
   * Handles visual updates based on scroll position.
   * Applies transform and opacity to header, input, info button, and wrapper.
   * Adjusts behavior based on screen width for mobile responsiveness.
   *
   * @public
   * @function
   * @param {number} scrollTop - The current scroll offset from the top.
   * @returns {void}
   */
  scroll(scrollTop) {
    if (!this.main) return;
    const { transform, opacity } = this._calculateAnimation(scrollTop);

    requestAnimationFrame(() => {
      if (this.input) this.input.style.opacity = (1 - opacity).toFixed(2);
      if (this.header) this.header.style.transform = `translateY(-${transform}px)`;
      if (this.main) this.main.style.transform = `translateY(-${transform}px)`;
      
      const buttons = [
        this.loginButton,
        this.infoButton
      ].filter(button => button !== null);
      
      buttons.forEach(button => {
        button.style.transform = `translateY(${(transform / this._infoTranslateFactor).toFixed(2)}px)`;
      });

      if (this._isMobile) {
        const infoOpacity = this._mobileOpacity(transform);

        this.infoButton.style.opacity = infoOpacity.toFixed(2);
        this.infoButton.style.display = infoOpacity < 0.02 ? 'none' : 'flex';
      } else {
        this.infoButton.style.opacity = '1';
        this.infoButton.style.display = 'flex';
      }
    });
  }
}
