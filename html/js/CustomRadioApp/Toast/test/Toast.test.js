import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import sleep from '../../utils/sleep.js';
import Toast from '../Toast.js';
import ToastCache from '../ToastCache.js';

describe('Toast', () => {
  let body;

  beforeEach(async () => {
    document.body.innerHTML = '';
    body = document.body;
  });

  afterEach(() => {
    sinon.restore();
    document.body.replaceChildren();
  });

  it('should create a toast and append it to the body', async () => {
    const message = 'Test message';
    const toastEl = new Toast(message);

    const toast = document.querySelector('#toast');
    expect(toast).to.exist;
    expect(toast.textContent).to.equal(message);
    expect(body.contains(toast)).to.be.true;
  });

  it('should add a toast to the cache if a Toast is already displayed', () => {
    const message1 = 'First message';
    const message2 = 'Second message';

    const addToCacheStub = sinon.stub(ToastCache, 'addToCache');

    new Toast(message1);

    new Toast(message2);

    expect(addToCacheStub).to.have.been.calledWith(
      message2,
      3.5,
      undefined,
      undefined,
      sinon.match.func
    );
  });

  it('should handle a valid link click by dismissing toast and opening link', async () => {
    const message = 'Test valid link';
    const link = 'https://example.com';
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');

    const toast = new Toast(message, 3.5, link, linkText);

    const clickEvent = new MouseEvent('click');
    document.querySelector('#toast').dispatchEvent(clickEvent);

    expect(windowOpenStub).to.have.been.calledWith(link, '_blank');

    const transitionEndEvent = new Event('transitionend');
    document.querySelector('#toast').dispatchEvent(transitionEndEvent);

    expect(document.querySelector('#toast')).to.not.exist;

    windowOpenStub.restore();
  });

  it('should handle an invalid link click by dismissing toast', async () => {
    const message = 'Test invalid link';
    const invalidLink = 'invalid-url';
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');
    const errorStub = sinon.stub(console, 'error');

    new Toast(message, 3.5, invalidLink, linkText);

    const clickEvent = new MouseEvent('click');
    document.querySelector('#toast').dispatchEvent(clickEvent);

    expect(windowOpenStub).not.to.have.been.called;
    expect(errorStub).to.have.been.called;
    const transitionEndEvent = new Event('transitionend');
    document.querySelector('#toast').dispatchEvent(transitionEndEvent);

    const toastEl = document.querySelector('#toast');
    expect(toastEl).to.not.exist;

    windowOpenStub.restore();
    errorStub.restore();
  });

  it('should pause and resume timeout on mouse enter and leave', async () => {
    const clock = sinon.useFakeTimers();
    const toast = new Toast('Hover test', 2);
  
    // Simulate transition end to start the timer
    toast.toast.dispatchEvent(new Event('transitionend'));
  
    // Advance time by 1 second
    clock.tick(1000);
    toast._mouseIn(); // Simulate hover
  
    // Expect timer to be cleared
    expect(toast._timer).to.be.null;
  
    toast._mouseOut(); // Simulate mouse leave
    expect(toast._timer).to.exist;
  
    clock.restore();
  });
  

  it('should handle an empty string as an invalid link by dismissing toast', async () => {
    const message = 'Test empty string link';
    const invalidLink = '';
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');
    const errorStub = sinon.stub(console, 'error');

    const toast = new Toast(message, 3.5, invalidLink, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.dispatchEvent(clickEvent);

    expect(windowOpenStub).not.to.have.been.called;
    expect(errorStub).not.to.have.been.called;

    const transitionEndEvent = new Event('transitionend');
    toast.toast.dispatchEvent(transitionEndEvent);

    const toastEl = document.querySelector('#toast');
    expect(toastEl).to.not.exist;

    windowOpenStub.restore();
    errorStub.restore();
  });

  it('should handle null as a link by dismissing toast', async () => {
    const message = 'Test null link';
    const invalidLink = null;
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');
    const errorStub = sinon.stub(console, 'error');

    const toast = new Toast(message, 3.5, invalidLink, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.dispatchEvent(clickEvent);

    expect(windowOpenStub).not.to.have.been.called;
    expect(errorStub).not.to.have.been.called;

    const transitionEndEvent = new Event('transitionend');
    toast.toast.dispatchEvent(transitionEndEvent);

    const toastEl = document.querySelector('#toast');
    expect(toastEl).to.not.exist;

    windowOpenStub.restore();
    errorStub.restore();
  });

  it('should handle undefined as a invalid link and dismiss toast', async () => {
    const message = 'Test undefined link';
    const invalidLink = undefined;
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');
    const errorStub = sinon.stub(console, 'error');

    const toast = new Toast(message, 3.5, invalidLink, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.dispatchEvent(clickEvent);

    expect(windowOpenStub).not.to.have.been.called;
    expect(errorStub).not.to.have.been.called;

    const transitionEndEvent = new Event('transitionend');
    toast.toast.dispatchEvent(transitionEndEvent);

    const toastEl = document.querySelector('#toast');
    expect(toastEl).to.not.exist;

    windowOpenStub.restore();
    errorStub.restore();
  });

  it('should handle an link as function', async () => {
    const message = 'Test function as link';
    const link = sinon.stub().returns('Function executed');
    const linkText = 'Click here';

    const toast = new Toast(message, 3.5, link, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.dispatchEvent(clickEvent);

    expect(link).returned('Function executed');

    const transitionEndEvent = new Event('transitionend');
    toast.toast.dispatchEvent(transitionEndEvent);

    const toastEl = document.querySelector('#toast');
    expect(toastEl).to.not.exist;

  });

  it('should clean up event listeners when the toast is removed', () => {
    const message = 'Test cleanup';
    const toast = new Toast(message);

    const removeEventListenerSpy = sinon.spy(toast.toast, 'removeEventListener');
    toast._cleanupToast();

    expect(removeEventListenerSpy).to.have.been.calledWith('transitionend', toast._transitionEnd, true);
    expect(removeEventListenerSpy).to.have.been.calledWith('click', toast._clicked, true);
  });
});