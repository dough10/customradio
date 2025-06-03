import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import debounce from '../debounce.js';

describe('debounce', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should call the function after the specified delay', () => {
    const func = sinon.spy();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc();
    expect(func).not.to.have.been.called;

    clock.tick(300);
    expect(func).to.have.been.calledOnce;
  });

  it('should call the function only once if invoked multiple times within the delay', () => {
    const func = sinon.spy();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    clock.tick(299);
    expect(func).not.to.have.been.called;

    clock.tick(1); 
    expect(func).to.have.been.calledOnce;
  });

  it('should reset the delay if invoked again within the delay period', () => {
    const func = sinon.spy();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc();
    clock.tick(200);
    debouncedFunc();

    clock.tick(100);
    expect(func).not.to.have.been.called;

    clock.tick(200);
    expect(func).to.have.been.calledOnce;
  });

  it('should pass the correct arguments to the debounced function', () => {
    const func = sinon.spy();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc('arg1', 'arg2');
    clock.tick(300);

    expect(func).to.have.been.calledOnceWith('arg1', 'arg2');
  });
});