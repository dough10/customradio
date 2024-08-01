import { expect } from '@open-wc/testing';
import { queryString } from '../js/main.js';

describe('attaches query string', () => {
  
  it('outputs the query', () => {
    const str = 'jazz, blues';
    expect(queryString(str)).to.equal('?genres=jazz, blues');
  });

  it('outputs nothing if no input', () => {
    const str = '';
    expect(queryString(str)).to.equal('');
  });
});