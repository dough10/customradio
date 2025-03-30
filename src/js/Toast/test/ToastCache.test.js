import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import ToastCache from '../ToastCache.js';

describe('ToastCache', () => {
  let createToastStub;

  beforeEach(() => {
    document.body.innerHTML = '';
    createToastStub = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
    if (ToastCache._cacheWatcher) {
      clearInterval(ToastCache._cacheWatcher);
      ToastCache._cacheWatcher = null;
    }
    ToastCache._toastCache = [];
  });

  it('should add a toast to the cache and call createToast when no toast is displayed', async () => {
    const message = 'Test message';
    const timeout = 3.5;
    const link = 'https://example.com';
    const linkText = 'Click here';

    ToastCache.addToCache(message, timeout, link, linkText, createToastStub);

    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(createToastStub).to.have.been.calledOnceWith(message, timeout, link, linkText);
    expect(ToastCache._toastCache).to.be.empty;
  });

  it('should queue multiple toasts and display them in order', async () => {
    const message1 = 'First message';
    const message2 = 'Second message';
    const timeout = 3.5;

    ToastCache.addToCache(message1, timeout, null, null, createToastStub);
    ToastCache.addToCache(message2, timeout, null, null, createToastStub);

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(createToastStub).to.have.been.calledOnceWith(message1, timeout, null, null);

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(createToastStub).to.have.been.calledTwice;
    expect(createToastStub.secondCall).to.have.been.calledWith(message2, timeout, null, null);

    expect(ToastCache._toastCache).to.be.empty;
  });

  it('should not call createToast if a toast is already displayed', async () => {
    const message = 'Test message';
    const timeout = 3.5;

    const toastElement = document.createElement('div');
    toastElement.id = 'toast';
    document.body.appendChild(toastElement);

    ToastCache.addToCache(message, timeout, null, null, createToastStub);

    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(createToastStub).not.to.have.been.called;
    expect(ToastCache._toastCache).to.have.lengthOf(1);
  });

  it('should stop the cache watcher when the cache is empty', async () => {
    const message = 'Test message';
    const timeout = 3.5;

    ToastCache.addToCache(message, timeout, null, null, createToastStub);

    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(createToastStub).to.have.been.calledOnceWith(message, timeout, null, null);
    expect(ToastCache._cacheWatcher).to.be.null;
  });
});