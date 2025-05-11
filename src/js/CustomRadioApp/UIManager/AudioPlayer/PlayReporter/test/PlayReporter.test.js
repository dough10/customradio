import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { REPORTING_INTERVAL } from '../PlayReporter.js';
import PlayReporter from '../PlayReporter.js';

describe('PlayReporter', () => {
  let clock;
  let fetchStub;
  let requestIdleCallbackStub;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response());
    requestIdleCallbackStub = sinon.stub(window, 'requestIdleCallback')
      .callsFake(cb => cb({ timeRemaining: () => 100 }));
  });

  afterEach(() => {
    clock.restore();
    fetchStub.restore();
    requestIdleCallbackStub.restore();
  });

  it('should report play after interval', async () => {
    const reporter = new PlayReporter('test-station');
    clock.tick(REPORTING_INTERVAL * 60 * 1000);
    await Promise.resolve();
    expect(fetchStub.calledWith('/reportPlay/test-station')).to.be.true;
  });

  it('should retry failed reports', async () => {
    fetchStub.onFirstCall().rejects(new Error('Network error'));
    fetchStub.onSecondCall().resolves(new Response());

    const reporter = new PlayReporter('test-station');
    clock.tick(REPORTING_INTERVAL * 60 * 1000);
    await Promise.resolve();
    expect(fetchStub.callCount).to.equal(2);
  });

  it('should stop reporting when playStopped is called', async () => {
    const reporter = new PlayReporter('test-station');
    reporter.playStopped();

    clock.tick(REPORTING_INTERVAL * 60 * 1000);
    await Promise.resolve();
    expect(fetchStub.called).to.be.false;
  });

  it('should encode station ID in URL', async () => {
    const reporter = new PlayReporter('test/station');
    clock.tick(REPORTING_INTERVAL * 60 * 1000);
    await Promise.resolve();
    expect(fetchStub.calledWith('/reportPlay/test%2Fstation')).to.be.true;
  });

  it('should clean up resources when destroyed', () => {
    const reporter = new PlayReporter('test-station');
    const clearIntervalSpy = sinon.spy(window, 'clearInterval');

    reporter.destroy();

    expect(clearIntervalSpy.called).to.be.true;
    expect(reporter._intervalID).to.equal(0);

    clearIntervalSpy.restore();
  });

  it('should pause and stop interval', () => {
    const reporter = new PlayReporter('test-station');
    const clearIntervalSpy = sinon.spy(window, 'clearInterval');
    reporter.pause();

    expect(clearIntervalSpy.called).to.be.true;
    expect(reporter._intervalID).to.equal(0);
    expect(reporter._state).to.equal('paused');

    clearIntervalSpy.restore();
  });

  it('should resume if paused', () => {
    const reporter = new PlayReporter('test-station');
    reporter.pause();
    expect(reporter._intervalID).to.equal(0);

    reporter.resume();
    expect(reporter._intervalID).to.not.equal(0);
    expect(reporter._state).to.equal('idle');
  });

  it('should not resume if already stopped', () => {
    const reporter = new PlayReporter('test-station');
    reporter.playStopped();
    const originalIntervalId = reporter._intervalID;

    reporter.resume();
    expect(reporter._intervalID).to.equal(0);
    expect(reporter._state).to.equal('stopped');
  });

  it('should not report if stopped during requestIdleCallback', async () => {
    const reporter = new PlayReporter('test-station');

    reporter._state = 'stopped';
    await reporter._sendReport();
    expect(fetchStub.called).to.be.false;
  });
});
