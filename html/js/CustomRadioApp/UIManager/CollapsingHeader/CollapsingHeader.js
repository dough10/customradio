import EventManager from "../../EventManager/EventManager.js";
import ScrollMinder from "../../utils/ScrollMinder.js";

const MOBILE_THRESHOLD = 450;

/**
 * Class representing a scroll-responsive collapsing header.
 * Shrinks the header and adjusts element visibility based on scroll position,
 * with mobile-responsive adjustments for better UX on smaller screens.
 */
export default class CollapsingHeader {
  /** @private @type {Number} Maximum amount to shrink the header by (in px) */
  #shrinkHeaderBy = 64;

  /**
   * @private
   * @type {Number}
   * Controls how fast the header collapses.
   * (scrollTop / factor = shrink amount in px)
   */
  #factor = 5;

  /**
   * @private
   * @type {Number}
   * ammount of header that needs to be hidden before info button begins to fade in
   */
  #mobileInfoFadeDelay = 32;

  /**
   * @private
   * @type {Number}
   * extra dappener for header collapse when on mobile
   */
  #mobileMultiplier = 1.5;

  /**
   * @private
   * @type {Number}
   * dappening factor for info button transition
   */
  #infoTranslateFactor = 1.5; // the 1.5 seems to land the info button center of the collapsed header

  /**
   * @private
   * @type {EventManager}
   * Event manager for handling events
   */
  #em = new EventManager();

  #minder;

  constructor({header, input, main, info, login}) {
    if (!(header instanceof HTMLElement)) {
      throw new TypeError("header must be an HTMLElement");
    }

    if (!(main instanceof HTMLElement)) {
      throw new TypeError("main must be an HTMLElement");
    }

    if (input && !(input instanceof HTMLElement)) { // actually a form group not individual input element
      throw new TypeError("input must be an HTMLElement");
    }

    if (info && !(info instanceof HTMLButtonElement)) {
      throw new TypeError("info must be an HTMLButtonElement");
    }

    if (!(login instanceof HTMLButtonElement)) {
      throw new TypeError("login must be an HTMLButtonElement");
    }

    this.$header = header;
    this.$input = input;
    this.$main = main;
    this.$loginButton = login;
    this.$infoButton = info;
    
    /** recalculate header on window resize */
    if (this.#em.add(window, EventManager.types.resize, () => this.#onResize()) < 0) {
      throw new Error(`Failed adding resize listener`);
    }
    
    this.#minder = new ScrollMinder(main, {
      onScroll: (_, pos) => this.#scroll(pos)
    });
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
  #onResize() {
    this.#scroll(this.$main?.scrollTop || 0);
  }

  /**
   * @public
   * @function
   * remove resize event listener
   */
  destroy() {
    this.#em.removeAll();
    this.#minder.destroy();
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
  #calculateAnimation(scrollTop) {
    const factor = this._isMobile ? this.#factor * this.#mobileMultiplier : this.#factor;
    const transform = Math.min(scrollTop / factor, this.#shrinkHeaderBy);
    return {
      transform,
      opacity: transform / this.#shrinkHeaderBy
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
  #mobileOpacity(transform) {
    const adjustedOpacity = (transform - this.#mobileInfoFadeDelay) / (this.#shrinkHeaderBy - this.#mobileInfoFadeDelay);
    return Math.max(0, Math.min(1, adjustedOpacity));
  }

  /**
   * apply transform and opacity to animatable elements
   * 
   * @param {Number} transform 
   * @param {Number} opacity
   */
  #animate(transform, opacity) {
    if (this.$input) this.$input.style.opacity = (1 - opacity).toFixed(2);
    if (this.$header) this.$header.style.transform = `translateY(-${transform}px)`;
    if (this.$main) this.$main.style.transform = `translateY(-${transform}px)`;
    
    [
      this.$loginButton,
      this.$infoButton
    ].filter(button => button !== null).forEach(button => {
      if (button) button.style.transform = `translateY(${(transform / this.#infoTranslateFactor).toFixed(2)}px)`;
    });

    if (this._isMobile) {
      const infoOpacity = this.#mobileOpacity(transform);
      if (this.$infoButton) {
        this.$infoButton.style.opacity = infoOpacity.toFixed(2);
        this.$infoButton.style.display = infoOpacity < 0.02 ? 'none' : 'flex';
      }
    } else {
      if (this.$infoButton) {
        this.$infoButton.style.opacity = '1';
        this.$infoButton.style.display = 'flex';
      }
    }
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
  #scroll(scrollTop) {
    if (!this.$main) return;
    const { transform, opacity } = this.#calculateAnimation(scrollTop);
    requestAnimationFrame(_ => this.#animate(transform, opacity));
  }
}
