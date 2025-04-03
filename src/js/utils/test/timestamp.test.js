import { expect } from '@open-wc/testing';
import timestamp from '../timestamp.js';

describe('stamp function', () => {
  let OriginalDate;

  before(() => {
    OriginalDate = Date;
  });

  beforeEach(() => {
    const fixedDate = new Date('2024-08-01T00:00:00Z');
    globalThis.Date = class extends OriginalDate {
      constructor() {
        return fixedDate;
      }
    };
  });

  afterEach(() => {
    globalThis.Date = OriginalDate;
  });

  it('should return the correct format with the fixed date', () => {
    const formattedDate = new Date().toISOString().split('T')[0];
    const expectedOutput = `# created by http://localhost:8000 [${formattedDate}]\n`;

    const result = timestamp();
    expect(result).to.equal(expectedOutput);
  });
});
