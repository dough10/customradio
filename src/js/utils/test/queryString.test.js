import { expect } from '@open-wc/testing';
import queryString from '../queryString.js';

describe('attaches query string', () => {
  
  it('outputs the query', () => {
    const str = 'jazz, blues';
    expect(queryString(str)).to.equal('?genres=jazz%2C%20blues');
  });

  it('outputs nothing if no input', () => {
    const str = '';
    expect(queryString(str)).to.equal('');
  });
});