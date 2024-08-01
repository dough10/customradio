import { expect } from '@open-wc/testing';
import { stamp } from '../js/main.js';

describe('stamp function', () => {
  let OriginalDate;

  before(() => {
    // Save the original Date object
    OriginalDate = Date;
  });

  beforeEach(() => {
    // Stub the Date object to return a fixed date
    const fixedDate = new Date('2024-08-01T00:00:00Z');
    globalThis.Date = class extends OriginalDate {
      constructor() {
        return fixedDate;
      }
    };
  });

  afterEach(() => {
    // Restore the original Date object
    globalThis.Date = OriginalDate;
  });

  it('should return the correct format with the fixed date', () => {
    const formattedDate = new Date().toISOString().split('T')[0];
    const expectedOutput = `# created by https://customradio.dough10.me [${formattedDate}] #\n`;

    // Call the function and check the result
    const result = stamp();
    expect(result).to.equal(expectedOutput);
  });
});
