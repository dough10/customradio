import { expect } from '@open-wc/testing';
import toggleActiveState from '../toggleActiveState.js';

describe('toggleActiveState', () => {
  let button;

  beforeEach(() => {
    button = document.createElement('button');
  });

  it('should remove "disabled" attribute if selected > 0', () => {
    button.setAttribute('disabled', '');

    toggleActiveState(button, 2);

    expect(button.hasAttribute('disabled')).to.be.false;
  });

  it('should not add "disabled" attribute again if already present and selected == 0', () => {
    button.setAttribute('disabled', '');

    toggleActiveState(button, 0);

    expect(button.hasAttribute('disabled')).to.be.true;
  });

  it('should add "disabled" attribute if not present and selected == 0', () => {
    expect(button.hasAttribute('disabled')).to.be.false;

    toggleActiveState(button, 0);

    expect(button.hasAttribute('disabled')).to.be.true;
  });
});
