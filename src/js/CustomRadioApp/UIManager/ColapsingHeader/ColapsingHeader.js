export default class ColapsingHeader {
  _originalHeight = 128;
  // size in px to shrink header
  _shrinkHeaderBy = 64;
  // slowing factor.
  // factor px scrolled = 1 px header reduction
  _factor = 5;

  constructor() {
    this.header = document.querySelector('header');
    this.input = document.querySelector('.form-group');
    this.infoButton = document.querySelector('#info');
    this.wrapper = document.querySelector('.wrapper');
  }

  _calculateTransform(scrollTop) {
    return Math.min(scrollTop / this._factor, this._shrinkHeaderBy);
  }

  scroll(scrollTop) {
    const transform = this._calculateTransform(scrollTop);
    const opacity = transform / this._shrinkHeaderBy;
    
    this.input.style.opacity = 1 - opacity;
    this.header.style.transform = `translateY(-${transform}px)`;
    this.infoButton.style.transform = `translateY(${transform / 1.5}px)`;
    this.wrapper.style.top = `${this._originalHeight - transform}px`;
  
    if (window.innerWidth < 450) {
      this.infoButton.style.opacity = opacity;
      this.infoButton.style.display = opacity === 0 ? 'none' : 'flex';
    } else {
      if (this.infoButton.style.opacity !== '1') {
        this.infoButton.style.opacity = 1;
      }
    }
  }
}