import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {COUNTS_AS_PLAY_MINUTES} from '../PlayReporter.js';
import PlayReporter from '../PlayReporter.js';

describe('PlayReporter', () => {
  let clock;
  
  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should report play after specified duration', () => {
    const consoleSpy = sinon.spy(console, 'log');
    const reporter = new PlayReporter('test-station');
    
    clock.tick(COUNTS_AS_PLAY_MINUTES * 60 * 1000); // Advance 2 minutes
    
    expect(consoleSpy).to.have.been.calledWith(`Station test-station played for ${COUNTS_AS_PLAY_MINUTES} minutes`);
    consoleSpy.restore();
  });

  it('should cancel report when stopped', () => {
    const consoleSpy = sinon.spy(console, 'log');
    const reporter = new PlayReporter('test-station');
    
    reporter.playStopped();
    clock.tick(COUNTS_AS_PLAY_MINUTES * 60 * 1000);
    
    expect(consoleSpy).to.not.have.been.called;
    consoleSpy.restore();
  });
});