const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const Logger = require('../util/logger');

let chai;
let expect;

(async () => {
  chai = await import('chai');
  expect = chai.expect;

  describe('Logger', function() {
    let logger;
    const logDir = path.join(__dirname, '..', 'logs');
    const logFile = path.join(logDir, 'customradio.log');

    beforeEach(function() {
      logger = new Logger('debug');
      sinon.stub(console, 'log');
      sinon.stub(console, 'error');
      sinon.stub(console, 'warn');
    });

    afterEach(function() {
      sinon.restore();
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }
    });

    it('should log debug messages', async function() {
      await logger.debug('Debug message');
      expect(console.log.calledWithMatch(/\[DEBUG\] Debug message/)).to.be.true;
    });

    it('should not log debug messages when level is set to error', async function() {
      logger = new Logger('error');
      await logger.debug('Debug message');
      expect(console.log.calledWithMatch(/\[DEBUG\] Debug message/)).to.be.false;
    });

    it('should log info messages', async function() {
      await logger.info('Info message');
      expect(console.log.calledWithMatch(/\[INFO\] Info message/)).to.be.true;
    });

    it('should log warning messages', async function() {
      await logger.warning('Warning message');
      expect(console.log.calledWithMatch(/\[WARNING\] Warning message/)).to.be.true;
    });

    it('should log error messages', async function() {
      await logger.error('Error message');
      expect(console.log.calledWithMatch(/\[ERROR\] Error message/)).to.be.true;
    });

    it('should log critical messages', async function() {
      await logger.critical('Critical message');
      expect(console.log.calledWithMatch(/\[CRITICAL\] Critical message/)).to.be.true;
    });

    it('should initialize log file', async function() {
      await logger._initializeLogFile();
      expect(fs.existsSync(logFile)).to.be.true;
    });

    it('should rotate log file when size exceeds maxSize', async function() {
      logger._maxSize = 1; // Set maxSize to 1 byte to force rotation
      await logger.info('Test log rotation');
      expect(console.error.calledWithMatch(/\[CRITICAL\] Failed to check log file size/)).to.be.false;
    });

    it('should remove old log files', async function() {
      logger._maxBackups = 0; // Set maxBackups to 0 to force deletion
      await logger._removeOldLogFiles();
      expect(console.error.calledWithMatch(/\[CRITICAL\] Failed to remove old log files/)).to.be.false;
    });
  });

  run(); // Run the tests
})();