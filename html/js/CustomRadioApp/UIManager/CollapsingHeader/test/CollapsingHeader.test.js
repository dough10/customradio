import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import CollapsingHeader from '../CollapsingHeader';

const selectors = {
  filter: '#filter',
  toTop: '.to-top',
  genres: '#genres',
  stationCount: '#station-count',
  stationsContainer: '#stations',
  downloadButton: '#download',
  resetButton: '.reset',
  main: 'main',
  header: 'header',
  infoButton: '#info',
  formGroup: '.form-group',
  player: '.player',
  name: '#name',
  bitrate: '#bitrate',
  volume: '#vol',
  smallButton: '.player>.small-button',
  stations: '#stations>li',
  icon: '.player>.small-button>svg>path',
  add: '#add_button',
};

describe('CollapsingHeader', () => {
  let clock;
  beforeEach(() => {
    clock = sinon.useFakeTimers();
    document.body.innerHTML = `
      <header>
        <div class="form-group"></div>
        <button id="info"></button>
      </header>
      <main></main>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    clock.restore();
    sinon.restore();
  });

  it('should query elements from dom', () => {
    const header = new CollapsingHeader(selectors);
    expect(header.header, 'query header element').to.exist;
    expect(header.input, 'should query input form element').to.exist;
    expect(header.infoButton, 'should query info button').to.exist;
    expect(header.main, 'should query main wrapper').to.exist;    
  });

  it('should attach resize listener', () => {
    const listenerSpy = sinon.spy(window, 'addEventListener');
    new CollapsingHeader(selectors);
    expect(listenerSpy, 'should add a resize listener').to.have.been.calledOnceWith('resize', sinon.match.func);
    listenerSpy.restore();
  });

  it('should revove resize listener when destroy is called', () => {
    const listenerSpy = sinon.spy(window, 'removeEventListener');
    const header = new CollapsingHeader(selectors);
    header.destroy();
    expect(listenerSpy, 'should remove a resize listener').to.have.been.calledOnceWith('resize', sinon.match.func);
    listenerSpy.restore();
  });

  it('should calculate a 5 to 1 ratio of scroll to header shrink. up to a max of transform = 64 opacity = 1', () => {
    const header = new CollapsingHeader(selectors);

    const calculation = header._calculateAnimation(header._factor);
    expect(calculation.transform, 'calcuate transform').to.equal(1);
    expect(calculation.opacity, 'calculate opacity').to.equal(0.015625);

    const calculation2 = header._calculateAnimation(64 * header._factor);
    expect(calculation2.transform, 'calcuate transform').to.equal(64);
    expect(calculation2.opacity, 'calculate opacity').to.equal(1);

    const calculation3 = header._calculateAnimation(1320);
    expect(calculation3.transform, 'calcuate transform').to.equal(64);
    expect(calculation3.opacity, 'calculate opacity').to.equal(1);
  });

  it('should calculate a 7.5 to 1 ratio of scroll to header shrink for mobile. up to a max of transform = 64 opacity = 1', () => {
    sinon.stub(window, 'innerWidth').value(375);
    const header = new CollapsingHeader(selectors);

    const calculation = header._calculateAnimation(header._factor * header._mobileMultiplier);
    expect(calculation.transform, 'calcuate transform').to.equal(1);
    expect(calculation.opacity, 'calculate opacity').to.equal(0.015625);

    const calculation2 = header._calculateAnimation(64 * (header._factor * header._mobileMultiplier));
    expect(calculation2.transform, 'calcuate transform').to.equal(64);
    expect(calculation2.opacity, 'calculate opacity').to.equal(1);

    const calculation3 = header._calculateAnimation(1320);
    expect(calculation3.transform, 'calcuate transform').to.equal(64);
    expect(calculation3.opacity, 'calculate opacity').to.equal(1);
  });


  it('should apply transform and opacity based on scrollTop', async () => {
    const header = new CollapsingHeader(selectors);
  
    sinon.stub(window, 'innerWidth').value(1024);
    const scrollTop = 100;
    header.scroll(scrollTop);
  
    clock.tick(16);
    await Promise.resolve(); 
  
    const expectedTransform = Math.min(scrollTop / header._factor, header._shrinkHeaderBy);
    const expectedOpacity = expectedTransform / header._shrinkHeaderBy;
  
    expect(header.header.style.transform, 'should apply transform to header').to.equal(`translateY(-${expectedTransform}px)`);
    expect(header.input.style.opacity, 'should apply opacity to input').to.equal((1 - expectedOpacity).toFixed(2));
    expect(header.main.style.transform, 'should apply transform to main wrapper').to.equal(`translateY(-${expectedTransform}px)`);
    expect(header.infoButton.style.transform, 'should apply transform to info button').to.equal(`translateY(${(expectedTransform / 1.5).toFixed(2)}px)`);
    expect(header.infoButton.style.opacity, 'should set info button opacity to 1').to.equal('1');
    expect(header.infoButton.style.display, 'should set info button display to flex').to.equal('flex');
  });
  
  it('should hide info button when transform is less than fade delay', async () => {
    sinon.stub(window, 'innerWidth').value(375);
    const header = new CollapsingHeader(selectors);
  
    const scrollTop = 100; // 20px of header is offscreen fade in begins at > 160
    header.scroll(scrollTop);

    clock.tick(16);
    await Promise.resolve(); 
  
    expect(header.infoButton.style.opacity, 'should not change opacity').to.equal('0');
    expect(header.infoButton.style.display, 'should not change display').to.equal('none');
  });
  
  it('should show info button when transform is above fade delay', async () => {
    sinon.stub(window, 'innerWidth').value(375);
    const header = new CollapsingHeader(selectors);
  
    const scrollTop = 320;  // header is fully collapsed
    header.scroll(scrollTop);

    clock.tick(16);
    await Promise.resolve(); 

    expect(header.infoButton.style.opacity, 'should change opacity').to.not.equal('0');
    expect(header.infoButton.style.display, 'should change display').to.equal('flex');
  });
  
});
