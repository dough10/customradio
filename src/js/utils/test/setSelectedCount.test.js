import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import setSelectedCount from '../setSelectedCount.js';

describe('setSelectedCount', () => {
  let countElement;
  let dlButton;

  beforeEach(() => {
    // Set up the DOM structure for testing
    document.body.innerHTML = `
      <div id="count"></div>
      <button id="download" disabled></button>
    `;

    countElement = document.querySelector('#count');
    dlButton = document.querySelector('#download');
  });

  afterEach(() => {
    // Clean up the DOM after each test
    document.body.innerHTML = '';
    sinon.restore();
  });

  it('should update the count text for a single station', () => {
    setSelectedCount(1);

    expect(countElement.textContent).to.equal('1 station selected');
    expect(dlButton.hasAttribute('disabled')).to.be.false;
  });

  it('should update the count text for multiple stations', () => {
    setSelectedCount(5);

    expect(countElement.textContent).to.equal('5 stations selected');
    expect(dlButton.hasAttribute('disabled')).to.be.false;
  });

  it('should disable the download button when the count is zero', () => {
    dlButton.removeAttribute('disabled'); // Ensure the button starts enabled

    setSelectedCount(0);

    expect(countElement.textContent).to.equal('0 stations selected');
    expect(dlButton.hasAttribute('disabled')).to.be.true;
  });

  it('should not toggle the disabled attribute if the button is already disabled', () => {
    const toggleAttributeSpy = sinon.spy(dlButton, 'toggleAttribute');

    setSelectedCount(0);

    expect(toggleAttributeSpy.called).to.be.false;
    expect(dlButton.hasAttribute('disabled')).to.be.true;
  });

  it('should handle edge cases like negative numbers', () => {
    setSelectedCount(-1);

    expect(countElement.textContent).to.equal('-1 stations selected');
    expect(dlButton.hasAttribute('disabled')).to.be.true;
  });
});