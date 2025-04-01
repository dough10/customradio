import { expect } from '@open-wc/testing';
import { createSmallButton } from '../createSmallButton.js';

/* jshint -W030 */
describe('createSmallButton', () => {
  it('creates a button with the correct attributes and child icon', async () => {
    const icon = { viewbox: '0 0 24 24', d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' };
    const cssClass = 'test-class';
    const title = 'Test Button';
    const func = () => { console.log('Button clicked'); };

    const button = createSmallButton({ icon, cssClass, func, title });

    // Check the button element
    expect(button).to.exist;
    expect(button.tagName).to.equal('BUTTON');
    expect(button.title).to.equal(title);
    expect(button.type).to.equal('button');
    expect(button.classList.contains('small-button')).to.be.true;
    expect(button.classList.contains(cssClass)).to.be.true;

    // Check the icon (svg) element inside the button
    const svg = button.querySelector('svg');
    expect(svg).to.exist;
    expect(svg.getAttribute('viewBox')).to.equal(icon.viewbox);
    const path = svg.querySelector('path');
    expect(path).to.exist;
    expect(path.getAttribute('d')).to.equal(icon.d);

    // Check the click event listener
    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });
    button.click();
    expect(clicked).to.be.true;
  });

  it('button does not fire event when clicked if diabled', async () => {
    const icon = { viewbox: '0 0 24 24', d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' };
    const cssClass = 'test-class';
    const title = 'Test Button';
    const func = () => { console.log('Button clicked'); };

    const button = createSmallButton({ icon, cssClass, func, title });
    
    button.toggleAttribute('disabled');

    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });

    button.click();
    expect(clicked).to.be.false;
  });
});
/* jshint +W030 */
