import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import CollapsingHeader from '../CollapsingHeader';

describe('CollapsingHeader', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <header>
        <div class="form-group"></div>
        <button id="info"></button>
      </header>
      <main class='wrapper'></main>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    sinon.restore();
  });

  it('should query elements from dom', () => {
    const header = new CollapsingHeader();
    expect(header.header, 'query header element').to.exist;
    expect(header.input, 'should query input form element').to.exist;
    expect(header.infoButton, 'should query info button').to.exist;
    expect(header.wrapper, 'should query main wrapper').to.exist;    
  });

  it('should attach resize listener', () => {
    const listenerSpy = sinon.spy(window, 'addEventListener');
    new CollapsingHeader();
    expect(listenerSpy, 'should call addEventListener').to.have.been.calledOnce;
    expect(listenerSpy, 'should add a resize listener').to.have.been.calledOnceWith('resize', sinon.match.func);
    listenerSpy.restore();
  });

  it('should revove resize listener when destroy is called', () => {
    const listenerSpy = sinon.spy(window, 'removeEventListener');
    const header = new CollapsingHeader();
    header.destroy();
    expect(listenerSpy, 'should call removeEventListener').to.have.been.calledOnce;
    expect(listenerSpy, 'should remove a resize listener').to.have.been.calledOnceWith('resize', sinon.match.func);
    listenerSpy.restore();
  });

  it('should calculate a 5 to 1 ratio of scroll to header shrink. up to a max of transform = 64 opacity = 1', () => {
    const header = new CollapsingHeader();

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
    const header = new CollapsingHeader();

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
    const header = new CollapsingHeader();
  
    sinon.stub(window, 'innerWidth').value(1024);
    const scrollTop = 100;
    header.scroll(scrollTop);
  
    await new Promise(requestAnimationFrame);
  
    const expectedTransform = Math.min(scrollTop / header._factor, header._shrinkHeaderBy);
    const expectedOpacity = expectedTransform / header._shrinkHeaderBy;
  
    expect(header.header.style.transform, 'should apply transform to header').to.equal(`translateY(-${expectedTransform}px)`);
    expect(header.input.style.opacity, 'should apply opacity to input').to.equal((1 - expectedOpacity).toFixed(2));
    expect(header.wrapper.style.transform, 'should apply transform to main wrapper').to.equal(`translateY(-${expectedTransform}px)`);
    expect(header.infoButton.style.transform, 'should apply transform to info button').to.equal(`translateY(${(expectedTransform / 1.5).toFixed(2)}px)`);
    expect(header.infoButton.style.opacity, 'should set info button opacity to 1').to.equal('1');
    expect(header.infoButton.style.display, 'should set info button display to flex').to.equal('flex');
  });
  
  it('should adjust info button opacity and display on mobile', async () => {
    sinon.stub(window, 'innerWidth').value(375); // Mobile
    const header = new CollapsingHeader();
    const scrollTop = 100;
    header.scroll(scrollTop);
  
    await new Promise(requestAnimationFrame);
  
    expect(header.infoButton.style.opacity).to.equal('0');
    expect(header.infoButton.style.display).to.equal('none');
  });
  
  it('should hide info button when transform is less than fade delay', async () => {
    sinon.stub(window, 'innerWidth').value(375);
    const header = new CollapsingHeader();
  
    const scrollTop = 100; // 20px of header is offscreen fade in begins at > 160
    header.scroll(scrollTop);
    await new Promise(requestAnimationFrame);
  
    expect(header.infoButton.style.opacity).to.equal('0');
    expect(header.infoButton.style.display).to.equal('none');
  });
  
  it('should fade in info button when transform is above fade delay', async () => {
    sinon.stub(window, 'innerWidth').value(375);
    const header = new CollapsingHeader();
  
    const scrollTop = 320;  // header is fully collapsed
    header.scroll(scrollTop);
    await new Promise(requestAnimationFrame);
  
    expect(header.infoButton.style.opacity).to.not.equal('0');
    expect(header.infoButton.style.display).to.equal('flex');
  });
  
});