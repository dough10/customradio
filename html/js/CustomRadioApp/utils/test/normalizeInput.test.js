import { expect } from '@open-wc/testing';
import normalizeInput from '../normalizeInput.js';

describe('normalizeInput', () => {
  it('should convert to lowercase', () => {
    expect(normalizeInput('HELLO')).to.equal('hello');
  });

  it('should replace & and "and" with "and"', () => {
    expect(normalizeInput('Rock & Roll')).to.equal('rock and roll');
    expect(normalizeInput('Rhythm and Blues')).to.equal('rhythm and blues');
  });

  it('should normalize common n-abbreviations to "and"', () => {
    expect(normalizeInput("R'n'B")).to.equal('r and b');
    expect(normalizeInput("rock n roll")).to.equal('rock and roll');
    expect(normalizeInput("guns n' roses")).to.equal('guns and roses');
    expect(normalizeInput("hip n hop")).to.equal('hip and hop');
  });

  it('should remove diacritics (accents)', () => {
    expect(normalizeInput('Beyoncé')).to.equal('beyonce');
    expect(normalizeInput('José González')).to.equal('jose gonzalez');
  });

  it('should remove non-alphanumeric characters except spaces', () => {
    expect(normalizeInput('AC/DC!')).to.equal('ac/dc');
  });

  it('should normalize extra whitespace', () => {
    expect(normalizeInput('   hello    world   ')).to.equal('hello world');
  });

  it('should return empty string if input is empty or only symbols', () => {
    expect(normalizeInput('')).to.equal('');
    expect(normalizeInput('!!!')).to.equal('');
    expect(normalizeInput('    ')).to.equal('');
  });

  it('should handle multiple transformations in one input', () => {
    const input = "R&B / Soul n' Funk & Pop-Rock";
    const expected = 'r and b / soul and funk and pop rock';
    expect(normalizeInput(input)).to.equal(expected);
  });

  it('should handle https only', () => {
    expect(normalizeInput('https')).to.equal('https');
  });

  it('should remove the protocol and "www" from URLs', () => {
    expect(normalizeInput('https://www.example.com'), '1').to.equal('https://www.example.com');
    expect(normalizeInput('http://example.com'), '2').to.equal('http://example.com');
    expect(normalizeInput('www.example.com'), '3').to.equal('www.example.com');
    expect(normalizeInput('https://air.dnbfm.ru/listen/player/play'), '4').to.equal('https://air.dnbfm.ru/listen/player/play');
  });

  it('should normalize URL paths without altering query parameters', () => {
    expect(normalizeInput('https://example.com/path/to/resource')).to.equal('https://example.com/path/to/resource');
    expect(normalizeInput('http://example.com/about-us')).to.equal('http://example.com/about-us');
    expect(normalizeInput('example.com/hello/world')).to.equal('example.com/hello/world');
  });

  it('should handle URLs with query parameters', () => {
    expect(normalizeInput('https://example.com/search?q=hello world')).to.equal('https://example.com/search?q=hello world');
    expect(normalizeInput('https://example.com/product/12345?ref=homepage')).to.equal('https://example.com/product/12345?ref=homepage');
  });

  it('should ignore fragments in URLs', () => {
    expect(normalizeInput('https://example.com/page#section')).to.equal('https://example.com/page#section');
    expect(normalizeInput('http://example.com/about#contact')).to.equal('http://example.com/about#contact');
  });
});
