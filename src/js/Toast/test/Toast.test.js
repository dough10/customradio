import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Toast from '../Toast.js';
import ToastCache from '../ToastCache.js';

describe('Toast', () => {
  let body;

  beforeEach(() => {
    document.body.innerHTML = '';
    body = document.body;
  });

  afterEach(() => {
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

  it('should handle a valid link click', async () => {
    const message = 'Test message';
    const link = 'https://example.com';
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');

    const toast = new Toast(message, 3.5, link, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.dispatchEvent(clickEvent);

    expect(windowOpenStub).to.have.been.calledWith(link, '_blank');

    windowOpenStub.restore();
  });

  it('should handle an invalid link click', async () => {
    const message = 'Test message';
    const invalidLink = 'invalid-url';
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');
    const errorStub = sinon.stub(console, 'error');

    const toast = new Toast(message, 3.5, invalidLink, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.querySelector('div').dispatchEvent(clickEvent);

    expect(windowOpenStub).not.to.have.been.called;
    expect(errorStub).to.have.been.calledWith(`Invalid "link" parameter in Toast. Message: "${message}", Link: "${invalidLink}", Type: ${typeof invalidLink}`);

    windowOpenStub.restore();
  });

  it('should handle an empty string as an invalid link', async () => {
    const message = 'Test message';
    const invalidLink = '';
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');
    const errorStub = sinon.stub(console, 'error');

    const toast = new Toast(message, 3.5, invalidLink, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.dispatchEvent(clickEvent);

    expect(windowOpenStub).not.to.have.been.called;
    expect(errorStub).to.have.been.calledWith(`Invalid "link" parameter in Toast. Message: "${message}", Link: "${invalidLink}", Type: ${typeof invalidLink}`);

    windowOpenStub.restore();
    errorStub.restore();
  });

  it('should handle null as an invalid link', async () => {
    const message = 'Test message';
    const invalidLink = null;
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');
    const errorStub = sinon.stub(console, 'error');

    const toast = new Toast(message, 3.5, invalidLink, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.dispatchEvent(clickEvent);

    expect(windowOpenStub).not.to.have.been.called;
    expect(errorStub).to.have.been.calledWith(`Invalid "link" parameter in Toast. Message: "${message}", Link: "${invalidLink}", Type: ${typeof invalidLink}`);

    windowOpenStub.restore();
    errorStub.restore();
  });

  it('should handle undefined as an invalid link', async () => {
    const message = 'Test message';
    const invalidLink = undefined;
    const linkText = 'Click here';

    const windowOpenStub = sinon.stub(window, 'open');
    const errorStub = sinon.stub(console, 'error');

    const toast = new Toast(message, 3.5, invalidLink, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.dispatchEvent(clickEvent);

    expect(windowOpenStub).not.to.have.been.called;
    expect(errorStub).to.have.been.calledWith(`Invalid "link" parameter in Toast. Message: "${message}", Link: "${invalidLink}", Type: ${typeof invalidLink}`);

    windowOpenStub.restore();
    errorStub.restore();
  });

  it('should handle an link as function', async () => {
    const message = 'Test message';
    const link = sinon.stub().returns('Function executed');
    const linkText = 'Click here';

    const toast = new Toast(message, 3.5, link, linkText);

    const clickEvent = new MouseEvent('click');
    toast.toast.dispatchEvent(clickEvent);

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