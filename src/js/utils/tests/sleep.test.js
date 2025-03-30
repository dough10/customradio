import { expect } from '@open-wc/testing';
import sleep from '../sleep.js';

describe('sleep', () => {
  it('should resolve after the specified time', async () => {
    const start = Date.now();
    const delay = 100; // 100 milliseconds
    await sleep(delay);
    const end = Date.now();

    // Check if the elapsed time is approximately equal to the delay
    expect(end - start).to.be.at.least(delay);
    expect(end - start).to.be.below(delay + 20); // Allow a small margin for timing inaccuracies
  });
});