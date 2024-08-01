import { expect, fixture, html } from '@open-wc/testing';
import { createStationElement } from '../js/main.js';

/* jshint -W030 */
describe('createStationElement', () => {
  it('creates an li element with the correct attributes and children', async () => {
    const name = 'Test Station';
    const url = 'http://example.com/stream';
    const bitrate = 128;

    const li = createStationElement({ name, url, bitrate });

    // Check the li element
    expect(li).to.exist;
    expect(li.tagName).to.equal('LI');
    expect(li.title).to.equal(name);
    expect(li.dataset.url).to.equal(url);
    expect(li.dataset.bitrate).to.equal(bitrate.toString());

    // Check the span element
    const span = li.querySelector('span');
    expect(span).to.exist;
    expect(span.textContent).to.equal(name);

    // Check the div element
    const div = li.querySelector('div');
    expect(div).to.exist;
    expect(div.textContent).to.equal(`${bitrate}kbps`);
    expect(div.title).to.equal(`${bitrate}kbps`);

    // Check the buttons
    const buttons = li.querySelectorAll('button');
    expect(buttons.length).to.equal(3);

    const buttonTitles = ['Play stream', 'Add to file', 'Remove from file'];
    buttons.forEach((button, index) => {
      expect(button.title).to.equal(buttonTitles[index]);
      expect(button.classList.contains('small-button')).to.be.true;
    });
  });
});
/* jshint +W030 */