// test/retry.test.js
const { expect } = require('chai');
const retry = require('../util/retry.js'); // assuming the file is retry.js

describe('retry', () => {
  it('should retry the given number of times and eventually throw', async () => {
    let attempts = 0;
    const failingFn = async () => {
      attempts++;
      throw new Error('fail');
    };

    try {
      await retry(failingFn, 3);
    } catch (e) {
      expect(e.message).to.equal('fail');
      expect(attempts).to.equal(3);
    }
  });

  it('should succeed if the function succeeds before max retries', async () => {
    let attempts = 0;
    const flakyFn = async () => {
      attempts++;
      if (attempts < 2) throw new Error('fail');
      return 'success';
    };

    const result = await retry(flakyFn, 3);
    expect(result).to.equal('success');
    expect(attempts).to.equal(2);
  });
});
