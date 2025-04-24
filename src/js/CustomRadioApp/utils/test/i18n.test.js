import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import * as i18n from '../i18n.js';

describe('i18n', () => {
  beforeEach(() => {
    i18n.setLanguage('en');
  });

  it('should return result from a translation function', () => {
    const result = i18n.t('playing', 'My Song');
    expect(result).to.equal('Playing: My Song');
  });

  it('should default to "en" if unknown language is set', () => {
    const consoleWarnStub = sinon.stub(console, 'warn');

    i18n.setLanguage('xx'); // unknown language
    const result = i18n.t('playing', 'Fallback Song');

    expect(result).to.equal('Playing: Fallback Song');

    consoleWarnStub.restore();
  });

  it('should return the key if translation is missing', () => {
    const result = i18n.t('nonexistent_key');
    expect(result).to.equal('nonexistent_key');
  });
});
