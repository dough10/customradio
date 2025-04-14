/**
 * Class representing a scroll-responsive collapsing header.
 * Shrinks the header and adjusts element visibility based on scroll position,
 * with mobile-responsive adjustments for better UX on smaller screens.
 */
export default class ColapsingHeader {
  /** @private @type {number} Maximum amount to shrink the header by (in px) */
  _shrinkHeaderBy = 64;

  /**
   * @private
   * @type {number}
   * Controls how fast the header collapses.
   * (scrollTop / factor = shrink amount in px)
   */
  _factor = 5;

    /**
   * @private
   * @type {number}
   * ammount of header that needs to be hidden before info button begins to fade in
   */
  _mobileInfoFadeDelay = 32;

  constructor() {
    /** @type {HTMLElement|null} Header element */
    this.header = document.querySelector('header');

    /** @type {HTMLElement|null} Input container element */
    this.input = document.querySelector('.form-group');

    /** @type {HTMLElement|null} Info button element */
    this.infoButton = document.querySelector('#info');

    /** @type {HTMLElement|null} Main content wrapper */
    this.wrapper = document.querySelector('.wrapper');

    window.addEventListener('resize', this.scroll.bind(this));
  }

  /**
   * remove resize event listener
   */
  destroy() {
    window.removeEventListener('resize', this.scroll.bind(this));
  }

  /**
   * Calculates the transform distance and opacity based on scroll position.
   * Values are adjusted for mobile screens for smoother behavior.
   *
   * @private
   * @param {number} scrollTop - Current vertical scroll position.
   * @returns {{ transform: number, opacity: number }} Object containing calculated values.
   */
  _calculateAnimation(scrollTop) {
    this._isMobile = window.innerWidth < 450;
    const factor = this._isMobile ? this._factor * 1.5 : this._factor;
    const transform = Math.min(scrollTop / factor, this._shrinkHeaderBy);
    return {
      transform,
      opacity: transform / this._shrinkHeaderBy
    };
  }

  /**
   * calculate opacity for info button based on ammount of header hidden
   * 
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
   * @param {number} scrollTop - The current scroll offset from the top.
   * @returns {void}
   */
  scroll(scrollTop) {
    const { transform, opacity } = this._calculateAnimation(scrollTop);

    requestAnimationFrame(() => {
      if (this.input) this.input.style.opacity = (1 - opacity).toFixed(2);
      if (this.header) this.header.style.transform = `translateY(-${transform}px)`;
      if (this.wrapper) this.wrapper.style.transform = `translateY(-${transform}px)`;

      if (this.infoButton) {
        this.infoButton.style.transform = `translateY(${transform / 1.5}px)`;

        if (this._isMobile) {
          const infoOpacity = this._mobileOpacity(transform);

          this.infoButton.style.opacity = infoOpacity.toFixed(2);
          this.infoButton.style.display = infoOpacity < 0.05 ? 'none' : 'flex';
        } else {
          this.infoButton.style.opacity = '1';
          this.infoButton.style.display = 'flex';
        }
      }
    });
  }
}
