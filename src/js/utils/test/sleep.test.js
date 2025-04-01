import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import sleep from '../sleep.js';

describe('sleep', () => {
  it('should resolve after the specified time', async () => {
    const start = Date.now();
    const delay = 100;
    await sleep(delay);
    const end = Date.now();

    expect(end - start).to.be.at.least(delay);
    expect(end - start).to.be.below(delay + 20);
  });

  it('should not resolve before the specified time', async () => {
    const clock = sinon.useFakeTimers();

    const sleepPromise = sleep(500);
    let resolved = false;

    sleepPromise.then(() => {
      resolved = true;
    });

    clock.tick(499); 
    expect(resolved).to.be.false; 

    clock.tick(1);
    await sleepPromise;
    expect(resolved).to.be.true; 

    clock.restore();
  });
});