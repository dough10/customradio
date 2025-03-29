import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Toast from '../Toast.js';
import sleep from '../../utils/sleep.js';
import ToastCache from '../ToastCache.js';

describe('Toast', () => {
  let body;

  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
    body = document.body;
  });

  afterEach(() => {
    // Restore all Sinon stubs and spies
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('should create a toast and append it to the body', async () => {
    const message = 'Test message';
    new Toast(message);

    const toast = document.querySelector('#toast');
    expect(toast).to.exist;
    expect(toast.textContent).to.equal(message);
    expect(body.contains(toast)).to.be.true;
  });

  it('should add a toast to the cache if one is already displayed', () => {
    const message1 = 'First message';
    const message2 = 'Second message';

    // Stub ToastCache.addToCache
    const addToCacheStub = sinon.stub(ToastCache, 'addToCache');

    // Create the first toast
    new Toast(message1);

    // Create the second toast while the first is still displayed
    new Toast(message2);

    expect(addToCacheStub).to.have.been.calledWith(
      message2,
      3.5,
      undefined,
      undefined,
      sinon.match.func
    );
  });

  it('should handle a valid link click', async () => {
    const message = 'Test message';
    const link = 'https://example.com';
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');

    // Create the toast
    const toast = new Toast(message, 3.5, link, linkText);

    // Simulate a click event
    const clickEvent = new MouseEvent('click');
    toast.toast.querySelector('div').dispatchEvent(clickEvent);

    // Assertions
    expect(windowOpenStub).to.have.been.calledWith(link, '_blank');

    windowOpenStub.restore();
  });

  it('should handle an link as function', async () => {
    const message = 'Test message';
    const link = sinon.stub().returns('Function executed');
    const linkText = 'Click here';


    // Create the toast
    const toast = new Toast(message, 3.5, link, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.querySelector('div').dispatchEvent(clickEvent);

    // // Assertions
    expect(link).returned('Function executed');
  });

  it('should clean up event listeners when the toast is removed', () => {
    const message = 'Test message';
    const toast = new Toast(message);

    const removeEventListenerSpy = sinon.spy(toast.toast, 'removeEventListener');
    toast._removeToast();

    expect(removeEventListenerSpy).to.have.been.calledWith('transitionend', toast._transitionEnd, true);
    expect(removeEventListenerSpy).to.have.been.calledWith('click', toast._clicked, true);
  });
});