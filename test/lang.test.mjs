import { expect } from 'chai';
import { setLanguage } from '../src/util/i18n.js';

describe('lang parse test', () => {
  it('should parse simple lang strings ie. EN', () => {
    const input = 'en';
    const lang = setLanguage(input);
    expect(lang).to.equal(input);
  });
  it('should parse simple lang strings ie. en-US', () => {
    const input = 'en-US';
    const lang = setLanguage(input);
    expect(lang).to.equal('en');
  });
  
  it('should parse simple lang strings ie. en; q=1.0', () => {
    const input = 'en; q=1.0';
    const lang = setLanguage(input);
    expect(lang).to.equal('en');
  });
});