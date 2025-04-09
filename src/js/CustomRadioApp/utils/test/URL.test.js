import { expect } from '@open-wc/testing';
import isValidURL from '../URL.js';

describe('isValidURL', () => {
  it('should return true for a valid HTTP URL', () => {
    const url = 'http://example.com';
    expect(isValidURL(url)).to.be.true;
  });

  it('should return true for a valid HTTPS URL', () => {
    const url = 'https://example.com';
    expect(isValidURL(url)).to.be.true;
  });

  it('should return true for a valid URL with a path', () => {
    const url = 'https://example.com/path/to/resource';
    expect(isValidURL(url)).to.be.true;
  });

  it('should return true for a valid URL with query parameters', () => {
    const url = 'https://example.com?query=param';
    expect(isValidURL(url)).to.be.true;
  });

  it('should return false for an invalid URL', () => {
    const url = 'invalid-url';
    expect(isValidURL(url)).to.be.false;
  });

  it('should return false for an empty string', () => {
    const url = '';
    expect(isValidURL(url)).to.be.false;
  });

  it('should return false for a string without a protocol', () => {
    const url = 'www.example.com';
    expect(isValidURL(url)).to.be.false;
  });

  it('should return false for a malformed URL', () => {
    const url = 'http://';
    expect(isValidURL(url)).to.be.false;
  });
});