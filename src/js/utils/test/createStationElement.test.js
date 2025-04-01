import { expect } from '@open-wc/testing';
import Sinon from 'sinon';
import { createStationElement } from '../createStationElement.js';


/* jshint -W030 */
describe('createStationElement', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="stations"></ul>
      <div id="count"></div>
      <button id="download" disabled></button>
      <div class="player">
        <span id="name">
          station name
        </span>
        <span id="bitrate">
          0kbps
        </span>
      </div>
    `;
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates an li element with the correct attributes and children', async () => {
    const name = 'Test Station';
    const url = 'http://example.com/stream';
    const bitrate = 128;
    const id = 'test-station-id';
    const genre = 'Test Genre';
    const icon = 'http://example.com/icon.png';
    const homepage = 'http://example.com/homepage';

    const player = {
      playStream: Sinon.spy()
    };
    const addEventListenerSpy = Sinon.spy(HTMLElement.prototype, 'addEventListener');
    const fetchStub = Sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve({ message: 'Report logged' }),
    });
    const windowOpenStub = Sinon.stub(window, 'open').returns(true);

    const li = createStationElement({ id, name, url, bitrate, genre, icon, homepage }, player);

    document.querySelector('#stations').appendChild(li);

    // Check the li element has correct attributes
    expect(li, 'li element was created').to.exist;
    expect(li.tagName, 'has correct tag name').to.equal('LI');
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

    // Check the name span element
    const span = li.querySelector('span');
    expect(span, 'has created the name container').to.exist;
    expect(span.textContent, 'name container has correct name').to.equal(name);

    // Check the bitrate div element
    const div = li.querySelector('div');
    expect(div, 'bitrate container was created').to.exist;
    expect(div.textContent, 'bitrate container has correct bitrate').to.equal(`${bitrate}kbps`);
    expect(div.title, 'bitrate container title attribute was set').to.equal(`${bitrate}kbps`);

    // Verify event listeners
    const expectedEvents = ['contextmenu', 'touchstart', 'touchend', 'touchmove'];
    expectedEvents.forEach(eventType => {
      expect(
        addEventListenerSpy.calledWith(eventType),
        `should have ${eventType} event listener`
      ).to.be.true;
    });

    // Check the buttons
    const buttons = li.querySelectorAll('button');
    expect(buttons.length, 'has correct number of buttons').to.equal(3);

    const buttonTitles = ['Play stream', 'Add to file', 'Remove from file'];
    buttons.forEach((button, index) => {
      expect(button.title).to.equal(buttonTitles[index]);
      expect(button.classList.contains('small-button')).to.be.true;

      // Simulate a click on each button and verify it responds
      const clickSpy = Sinon.spy(button, 'click');
      button.click();
      expect(clickSpy.calledOnce, `button ${index + 1} should respond to click`).to.be.true;
      clickSpy.restore();
    });

    expect(player.playStream.calledWith({
      id,
      url,
    }), 'should call playStream with correct parameters').to.be.true;

    const playerEl = document.querySelector('.player');
    expect(playerEl.querySelector('#name').textContent, 'player name should be set').to.equal(name);
    expect(playerEl.querySelector('#bitrate').textContent.trim(), 'player bitrate should be set').to.equal(`${bitrate}kbps`);
    expect(playerEl.hasAttribute('playing'), 'player should have playing attribute').to.be.true;

    // Simulate a contextmenu click
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 50,
      clientY: 50,
    });
    li.dispatchEvent(contextMenuEvent);

    const backdrop = document.querySelector('.backdrop');
    expect(backdrop, 'backdrop should be created').to.exist;
    expect(backdrop.classList.contains('backdrop'), 'backdrop should have the correct class').to.be.true;
    // expect(backdrop.hasAttribute('visable'), 'backdrop should be visible').to.be.true;

    const menu = document.querySelector('.context-menu');
    expect(menu, 'context menu should be created').to.exist;
    expect(menu.classList.contains('context-menu'), 'context menu should have the correct class').to.be.true;
    // expect(menu.hasAttribute('open'), 'context menu should be open').to.be.true;
    expect(menu.style.display, 'context menu should be visible').to.not.equal('none');
    expect(menu.style.left, 'context menu should have correct left position').to.equal('60px');
    expect(menu.style.top, 'context menu should have correct top position').to.equal('50px');
    
    expect(menu.childElementCount, 'context menu should have 2 children').to.equal(2);
    const menuItems = menu.querySelectorAll('li');
    expect(menuItems[0].tagName, 'first menu item should be an li').to.equal('LI');
    expect(menuItems[0].querySelector('span').textContent.trim(), 'first menu item text').to.equal('mark duplicate');
    expect(menuItems[0].title, 'first menu item title attribute').to.equal('mark station duplicate');

    expect(menuItems[1].tagName, 'second menu item should be an li').to.equal('LI');
    expect(menuItems[1].querySelector('span').textContent.trim(), 'second menu item text').to.equal('homepage');
    expect(menuItems[1].title, 'second menu item title attribute').to.equal(`navigate to ${homepage}`);
    
    // simulate report duplicate click
    menuItems[0].click();
    expect(fetchStub.calledWith('/mark-duplicate', Sinon.match.object), 'should call fetch with correct URL and options').to.be.true;

    // simulate homepage click
    menuItems[1].click();
    expect(windowOpenStub.calledOnce, 'should call window.open once').to.be.true;
    expect(windowOpenStub.calledWith(homepage), 'should open the correct homepage').to.be.true;

    fetchStub.restore();
    windowOpenStub.restore();
    addEventListenerSpy.restore();
  });
});
/* jshint +W030 */