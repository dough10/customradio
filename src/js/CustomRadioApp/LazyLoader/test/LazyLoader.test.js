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
    const lzldr = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    const pullCount = Math.round(window.innerHeight / 58) * 2;
    expect(container.children.length).to.equal(pullCount);
    expect(mockCreateStationElement.callCount).to.equal(pullCount);
    expect(lzldr._ndx).to.equal(pullCount);
    expect(lzldr._loading).to.be.false;
  });

  it('should load more elements when scrolling near the bottom', () => {
    const lzldr = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    const initialCount = container.children.length;

    // Scroll near the bottom
    parent.scrollTop = parent.scrollHeight;
    parent.dispatchEvent(new Event('scroll'));

    // Verify more elements were loaded
    expect(container.children.length, 'should be double the initial pull').to.be.greaterThan(initialCount);
    expect(mockCreateStationElement.callCount, 'should be called twice as many times').to.be.greaterThan(initialCount);
  });

  it('should not load elements if already loading or all are loaded', () => {
    const lzldr = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);
    lzldr._loading = true; // simulate loading in progress

    const currentCount = container.children.length;
    parent.scrollTop = parent.scrollHeight;
    parent.dispatchEvent(new Event('scroll'));

    // Nothing should be added
    expect(container.children.length).to.equal(currentCount);
  });

  it('should reset with new data and reload', () => {
    const lzldr = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    container.replaceChildren();
    const newList = list.slice(0, 10);
    lzldr.reset(newList);

    expect(container.children.length).to.be.lessThanOrEqual(10);

    // initial pull = normal pull * 2
    expect(mockCreateStationElement.callCount).to.be.lessThanOrEqual(30); // initial + reset
  });

  it('should clean up listeners on destroy', () => {
    const lzldr = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    const resizeSpy = Sinon.spy(window, 'removeEventListener');
    const scrollSpy = Sinon.spy(lzldr._parent, 'removeEventListener');

    lzldr.destroy();

    expect(resizeSpy).to.have.been.called;
    expect(scrollSpy).to.have.been.called;
  });

  it('should toggle loading state correctly', () => {
    const lzldr = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);

    // should start with loading state false
    expect(lzldr._loading).to.be.false;

    // should toggle loading state to input boolean value
    lzldr._setLoading(true);
    expect(lzldr._loading).to.be.true;
    expect(container.querySelector('.loading')).to.exist;

    // should not toggle loading state if already loading
    lzldr._setLoading(true);
    expect(lzldr._loading).to.be.true;
    expect(container.querySelector('.loading')).to.exist;

    // should toggle loading state to input boolean value
    lzldr._setLoading(false);
    expect(lzldr._loading).to.be.false;
    expect(container.querySelector('.loading')).to.not.exist;

    // should ignore input that is not a boolean that is not boolean
    lzldr._setLoading(0);
    expect(lzldr._loading).to.be.true;
    expect(container.querySelector('.loading')).to.exist;
 
    // should ignore input that is not a boolean and toggle state to false because last test was true
    lzldr._setLoading('false');
    expect(lzldr._loading).to.be.false;
    expect(container.querySelector('.loading')).to.not.exist;
  });

  it('should respond to window resize by loading more if needed', async () => {
    const lzldr = new LazyLoader(list, container, player, scrollFunc, mockCreateStationElement);
    const previousCount = container.children.length;

    // Simulate resize where window is now much taller
    Sinon.stub(window, 'innerHeight').value(window.innerHeight + 500);
    window.dispatchEvent(new Event('resize'));

    // Allow time for debounce
    await new Promise(resolve => setTimeout(resolve, 120));

    expect(container.children.length).to.be.greaterThan(previousCount);
  });
});
