import { expect } from '@open-wc/testing';
import Sinon from 'sinon';
import createStationElement from '../helpers/createStationElement.js';

/* jshint -W030 */
describe('createStationElement', () => {
  const name = 'Test Station';
  const url = 'http://example.com/stream';
  const bitrate = 128;
  const id = 'test-station-id';
  const genre = 'Test Genre';
  const icon = 'http://example.com/icon.png';
  const homepage = 'http://example.com/homepage';
  const station = {
    name, url, bitrate, id, genre, icon, homepage
  };

  let player, li, addEventListenerSpy;

  beforeEach(() => {
    player = { playStream: Sinon.spy() };
    addEventListenerSpy = Sinon.spy(HTMLElement.prototype, 'addEventListener');
    li = createStationElement(station, player);
    document.body.innerHTML = `
      <ul id="stations"></ul>
      <div id="count"></div>
      <button id="download" disabled></button>
    `;
    document.querySelector('#stations').appendChild(li);
  });

  afterEach(() => {
    addEventListenerSpy.restore();
    player = null;
    li = null;
    document.body.innerHTML = '';
  });

  it('creates an li element with the correct attributes', () => {
    expect(li instanceof HTMLLIElement, 'li is an instance of HTMLLIElement').to.be.true;
    expect(li.id, 'has id').to.equal(id);
    expect(li.dataset, 'li has dataset').to.exist;
    expect(li.dataset.name, 'has dataset.name').to.equal(name);
    expect(li.dataset.url, 'has dataset.url').to.equal(url);
    expect(li.dataset.bitrate, 'has dataset.bitrate').to.equal(bitrate.toString());
    expect(li.dataset.genre, 'has dataset.genre').to.equal(genre);
    expect(li.dataset.icon, 'has dataset.icon').to.equal(icon);
    expect(li.dataset.homepage, 'has dataset.homepage').to.equal(homepage);
    expect(li.hasAttribute('playing'), 'should not have playing attribute').to.be.false;
  });

  it('creates a name span element with correct content', () => {
    const span = li.querySelector('span');
    expect(span, 'has created the name container').to.exist;
    expect(span.textContent, 'name container has correct name').to.equal(name);
  });

  it('creates a bitrate div element with correct content and attributes', () => {
    const div = li.querySelector('div');
    expect(div, 'bitrate container was created').to.exist;
    expect(div.textContent, 'bitrate container has correct bitrate').to.equal(`${bitrate}kbps`);
    expect(div.title, 'bitrate container title attribute was set').to.equal(`${bitrate}kbps`);
  });
  
  it('should use ??? if bitrate = Number 0', () => {
    const bitrate0Station = {
      name, url, bitrate: 0, id, genre, icon, homepage
    };
    li = createStationElement(bitrate0Station, player);
    const div = li.querySelector('div');
    expect(div, 'bitrate container was created').to.exist;
    expect(div.textContent, 'bitrate container has correct bitrate').to.equal(`???kbps`);
    expect(div.title, 'bitrate container title attribute was set').to.equal(`???kbps`);
  });

  it('should use ??? if bitrate = String "0"', () => {
    const bitrate0Station = {
      name, url, bitrate: '0', id, genre, icon, homepage
    };
    li = createStationElement(bitrate0Station, player);
    const div = li.querySelector('div');
    expect(div, 'bitrate container was created').to.exist;
    expect(div.textContent, 'bitrate container has correct bitrate').to.equal(`???kbps`);
    expect(div.title, 'bitrate container title attribute was set').to.equal(`???kbps`);
  });

  it('adds correct event listeners to the li element', () => {
    const expectedEvents = ['contextmenu', 'touchstart', 'touchend', 'touchmove'];
    expectedEvents.forEach(eventType => {
      expect(
        addEventListenerSpy.calledWith(eventType),
        `should have ${eventType} event listener`
      ).to.be.true;
    });
  });

  it('creates buttons with correct attributes and functionality', () => {
    const downloadButton = document.querySelector('#download');
    const buttons = li.querySelectorAll('button');
    
    expect(buttons.length, 'has correct number of buttons').to.equal(3);
    
    buttons.forEach((button, index) => {
      expect(button.classList.contains('small-button')).to.be.true;
      
      const clickSpy = Sinon.spy(button, 'click');
      button.click();
      expect(clickSpy.calledOnce, `button ${index + 1} should respond to click`).to.be.true;
      switch (index) {
        case 0: 
          expect(button.title).to.equal('Play stream');
          expect(player.playStream.calledWith({ id, url, name, bitrate }), 'should call playStream with correct parameters').to.be.true;
          break;
        case 1:
          expect(button.title).to.equal('Add to file');
          expect(document.querySelectorAll('#stations>li[selected]').length, 'should have 1 selected station').to.equal(1);
          expect(downloadButton.hasAttribute('disabled'), 'should enabled download button').to.be.false;
          break;
        case 2:
          expect(button.title).to.equal('Remove from file');
          expect(document.querySelectorAll('#stations>li[selected]').length, 'should have 0 selected station').to.equal(0);
          expect(downloadButton.hasAttribute('disabled'), 'should disabled download button').to.be.true;
          break;
      }
      clickSpy.restore();
    });
  });

  it('handles contextmenu event and creates context menu', () => {
    const fetchStub = Sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve({ message: 'Report logged' }),
    });
    const windowOpenStub = Sinon.stub(window, 'open').returns(true);

    const homepage = 'http://example.com/homepage';

    const eventObj = {
      bubbles: true,
      cancelable: true,
      clientX: 50,
      clientY: 50,
    };

    const contextMenuEvent = new MouseEvent('contextmenu', eventObj);
    li.dispatchEvent(contextMenuEvent);

    const backdrop = document.querySelector('.backdrop');
    expect(backdrop, 'backdrop should be created').to.exist;
    expect(backdrop.classList.contains('backdrop'), 'backdrop should have the correct class').to.be.true;

    const menu = document.querySelector('.context-menu');
    expect(menu, 'context menu should be created').to.exist;
    expect(menu.classList.contains('context-menu'), 'context menu should have the correct class').to.be.true;
    expect(menu.style.display, 'context menu should be visible').to.not.equal('none');
    expect(menu.style.left, 'context menu should have correct left position').to.equal(`${eventObj.clientX + 10}px`);
    expect(menu.style.top, 'context menu should have correct top position').to.equal(`${eventObj.clientY}px`);

    const menuItems = menu.querySelectorAll('li');
    expect(menuItems[0].querySelector('span').textContent.trim(), 'first menu item text').to.equal('mark duplicate');
    expect(menuItems[1].querySelector('span').textContent.trim(), 'second menu item text').to.equal('homepage');

    menuItems[0].click();
    expect(fetchStub.calledWith('/mark-duplicate', Sinon.match.object), 'should call fetch with correct URL and options').to.be.true;

    menuItems[1].click();
    expect(windowOpenStub.calledWith(homepage), 'should open the correct homepage').to.be.true;

    fetchStub.restore();
    windowOpenStub.restore();
  });
});
/* jshint +W030 */