import { expect } from '@open-wc/testing';
import loadingAnimation from '../helpers/insertLoadingAnimation.js';

describe('loadingAnimation', () => {
  let parent;

  beforeEach(() => {
    // Create a parent element for testing
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  afterEach(() => {
    // Clean up the DOM after each test
    document.body.innerHTML = '';
  });

  it('should create a loading animation with 5 dots', () => {
    loadingAnimation(parent);

    const loadingDiv = parent.querySelector('.loading');
    expect(loadingDiv).to.exist;
    expect(loadingDiv.children).to.have.lengthOf(5);

    Array.from(loadingDiv.children).forEach((circle) => {
      expect(circle).to.have.class('circle');
    });
  });

  it('should not create a second loading animation if one already exists', () => {
    loadingAnimation(parent);
    loadingAnimation(parent); // Call it again

    const loadingDivs = parent.querySelectorAll('.loading');
    expect(loadingDivs).to.have.lengthOf(1); // Ensure only one loading div exists
  });

  it('should prepend the loading animation to the parent element', () => {
    const existingChild = document.createElement('div');
    existingChild.classList.add('existing-child');
    parent.appendChild(existingChild);

    loadingAnimation(parent);

    const loadingDiv = parent.querySelector('.loading');
    expect(parent.firstChild).to.equal(loadingDiv); // Ensure the loading div is prepended
  });
});