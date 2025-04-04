import { expect } from '@open-wc/testing';
import Sinon from 'sinon';
import LazyLoader from '../LazyLoader.js';

describe('LazyLoader', () => {
  let container, parent, list, player, scrollFunc, mockCreateStationElement;

  beforeEach(() => {
    // Set up the DOM structure for testing
    parent = document.createElement('div');
    parent.style.height = '500px';
    parent.style.overflow = 'auto';
    parent.style.position = 'relative';

    container = document.createElement('div');
    parent.appendChild(container);
    document.body.appendChild(parent);

    // Mock data
    list = Array.from({ length: 50 }, (_, i) => ({
      name: `Station ${i + 1}`,
      url: `http://example.com/stream${i + 1}`,
      bitrate: 128,
      id: `station-${i + 1}`,
      genre: 'Genre',
      icon: `http://example.com/icon${i + 1}.png`,
      homepage: `http://example.com/homepage${i + 1}`,
    }));

    // Mock player
    player = { playStream: Sinon.spy() };

    // Mock scroll callback
    scrollFunc = Sinon.spy();

    // Mock createStationElement
    mockCreateStationElement = Sinon.stub().callsFake(() => document.createElement('div'));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    Sinon.restore();
  });

  it('should load initial elements on instantiation', () => {
    new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    const pullCount = Math.round(window.innerHeight / 58);
    expect(container.children.length).to.equal(pullCount);
    expect(mockCreateStationElement.callCount).to.equal(pullCount);
  });

  // it('should load more elements when scrolling near the bottom', () => {
  //   const lazyLoader = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

  //   // Simulate initial content by appending enough children to the container
  //   const initialPullCount = Math.round(window.innerHeight / 58);
  //   for (let i = 0; i < initialPullCount; i++) {
  //     const child = document.createElement('div');
  //     child.style.height = '58px'; // Match the height used in getPullCount
  //     container.appendChild(child);
  //   }

  //   // Ensure the parent has a scrollable height
  //   expect(parent.scrollHeight).to.be.greaterThan(parent.clientHeight);

  //   // Simulate scrolling near the bottom
  //   parent.scrollTop = parent.scrollHeight - parent.clientHeight - 1; // Scroll to near the bottom
  //   parent.dispatchEvent(new Event('scroll'));

  //   // Verify that additional elements are loaded
  //   const pullCount = Math.round(window.innerHeight / 58);
  //   expect(container.children.length, '1').to.equal(pullCount * 3); // Initial + additional pull
  //   expect(mockCreateStationElement.callCount, '2').to.equal(pullCount * 2);

  //   // Ensure `_load` is not called again unnecessarily
  //   parent.dispatchEvent(new Event('scroll'));
  //   expect(container.children.length, '3').to.equal(pullCount * 3); // No additional elements should be loaded
  //   expect(mockCreateStationElement.callCount, '4').to.equal(pullCount * 2);
  // });

  // it('should adjust pull count on window resize', () => {
  //   const lazyLoader = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

  //   // Simulate window resize
  //   Sinon.stub(window, 'innerHeight').value(1000);
  //   window.dispatchEvent(new Event('resize'));

  //   const newPullCount = Math.round(1000 / 58);
  //   expect(container.children.length).to.equal(newPullCount);
  //   expect(mockCreateStationElement.callCount).to.equal(newPullCount);
  // });

  // it('should not load more elements if all elements are already loaded', () => {
  //   const lazyLoader = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

  //   // Simulate scrolling to load all elements
  //   while (container.children.length < list.length) {
  //     parent.scrollTop = parent.scrollHeight * 0.9;
  //     parent.dispatchEvent(new Event('scroll'));
  //   }

  //   expect(container.children.length).to.equal(list.length);
  //   expect(mockCreateStationElement.callCount).to.equal(list.length);

  //   // Try scrolling again
  //   parent.scrollTop = parent.scrollHeight * 0.9;
  //   parent.dispatchEvent(new Event('scroll'));

  //   // Ensure no additional elements are loaded
  //   expect(container.children.length).to.equal(list.length);
  //   expect(mockCreateStationElement.callCount).to.equal(list.length);
  // });

  // it('should call the scroll callback with the correct scroll position', () => {
  //   new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

  //   // Simulate scrolling
  //   parent.scrollTop = 100;
  //   parent.dispatchEvent(new Event('scroll'));

  //   expect(scrollFunc.calledOnce).to.be.true;
  //   expect(scrollFunc.calledWith(0)).to.be.true; // Initial scroll position

  //   // Simulate another scroll
  //   parent.scrollTop = 200;
  //   parent.dispatchEvent(new Event('scroll'));

  //   expect(scrollFunc.calledTwice).to.be.true;
  //   expect(scrollFunc.calledWith(100)).to.be.true; // Previous scroll position
  // });
});