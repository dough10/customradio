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
    expect(normalizeInput('AC/DC!')).to.equal('ac dc');
    expect(normalizeInput('A#1 Song @ Top')).to.equal('a1 song top');
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
    const expected = 'r and b soul and funk and pop rock';
    expect(normalizeInput(input)).to.equal(expected);
  });
});
