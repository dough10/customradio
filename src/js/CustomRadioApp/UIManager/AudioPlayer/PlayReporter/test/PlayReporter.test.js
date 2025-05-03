import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {REPORTING_INTERVAL} from '../PlayReporter.js';
import PlayReporter from '../PlayReporter.js';

describe('PlayReporter', () => {
  let clock;
  
  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  // it('should report play after specified duration', () => {
  //   const consoleSpy = sinon.spy(console, 'log');
  //   const reporter = new PlayReporter('test-station');
    
  //   clock.tick(REPORTING_INTERVAL * 60 * 1000);
    
  //   // expect(consoleSpy).to.have.been.calledWith(`Station test-station played for ${REPORTING_INTERVAL} minutes`);
  //   consoleSpy.restore();
  // });

  // it('should cancel report when stopped', () => {
  //   const consoleSpy = sinon.spy(console, 'log');
  //   const reporter = new PlayReporter('test-station');
    
  //   reporter.playStopped();
  //   clock.tick(REPORTING_INTERVAL * 60 * 1000);
    
  //   expect(consoleSpy).to.not.have.been.called;
  //   consoleSpy.restore();
  // });
});