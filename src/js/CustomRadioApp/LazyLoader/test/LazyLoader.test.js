import { expect, fixture } from '@open-wc/testing';
import Sinon from 'sinon';
import LazyLoader from '../LazyLoader.js';
import * as helpers from '../helpers/createStationElement.js';

describe('LazyLoader', () => {
  let container, parent, list, player, scrollFunc, mockCreateStationElement;

  beforeEach(() => {
    // Setup DOM
    parent = document.createElement('div');
    parent.style.height = '500px';
    parent.style.overflow = 'auto';
    parent.style.position = 'relative';

    container = document.createElement('div');
    parent.appendChild(container);
    document.body.appendChild(parent);

    // Mock station data
    list = Array.from({ length: 100 }, (_, i) => ({
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

    // Spy on scroll callback
    scrollFunc = Sinon.spy();

    // Stub createStationElement globally
    mockCreateStationElement = Sinon.stub().callsFake((station) => {
      const el = document.createElement('div');
      el.style.height = '58px';
      el.textContent = station.name;
      return el;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    Sinon.restore();
  });

  it('should load initial elements on instantiation', () => {
    new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    const pullCount = Math.round(window.innerHeight / 58) * 2;
    expect(container.children.length).to.equal(pullCount);
    expect(mockCreateStationElement.callCount).to.equal(pullCount);
  });

  it('should load more elements when scrolling near the bottom', () => {
    const lazyLoader = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    const initialCount = container.children.length;

    // Scroll near the bottom
    parent.scrollTop = parent.scrollHeight;
    parent.dispatchEvent(new Event('scroll'));

    // Verify more elements were loaded
    expect(container.children.length, 'should be double the initial pull').to.be.greaterThan(initialCount);
    expect(mockCreateStationElement.callCount, 'should be called twice as many times').to.be.greaterThan(initialCount);
  });

  it('should not load elements if already loading or all are loaded', () => {
    const lazyLoader = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);
    lazyLoader._loading = true; // simulate loading in progress

    const currentCount = container.children.length;
    parent.scrollTop = parent.scrollHeight;
    parent.dispatchEvent(new Event('scroll'));

    // Nothing should be added
    expect(container.children.length).to.equal(currentCount);
  });

  it('should reset with new data and reload', () => {
    const lazyLoader = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    container.replaceChildren();
    const newList = list.slice(0, 10);
    lazyLoader.reset(newList);

    expect(container.children.length).to.be.lessThanOrEqual(10);

    // initial pull = normal pull * 2
    expect(mockCreateStationElement.callCount).to.be.lessThanOrEqual(30); // initial + reset
  });

  it('should clean up listeners on destroy', () => {
    const lazyLoader = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    const resizeSpy = Sinon.spy(window, 'removeEventListener');
    const scrollSpy = Sinon.spy(lazyLoader._parent, 'removeEventListener');

    lazyLoader.destroy();

    expect(resizeSpy.calledWith('resize', lazyLoader._resizeHandler)).to.be.true;
    expect(scrollSpy.calledWith('scroll', lazyLoader._scrollHandler)).to.be.true;
  });

  it('should respond to window resize by loading more if needed', async () => {
    const lazyLoader = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);
    const previousCount = container.children.length;

    // Simulate resize where window is now much taller
    Sinon.stub(window, 'innerHeight').value(window.innerHeight + 500);
    window.dispatchEvent(new Event('resize'));

    // Allow time for debounce
    await new Promise(resolve => setTimeout(resolve, 120));

    expect(container.children.length).to.be.greaterThan(previousCount);
  });
});
