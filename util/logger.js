const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = require('fs');
const { appendFile, stat, rename, readdir, unlink} = fsPromises;

/**
 * A mapping of log levels to their respective numeric severity values.
 * 
 * @constant
 * @type {Object}
 * @property {number} debug - The lowest log level, used for detailed debugging information.
 * @property {number} info - Informational messages that highlight the progress of the application.
 * @property {number} warning - A warning that indicates a potential problem or a situation that should be monitored.
 * @property {number} error - Indicates a serious issue that needs immediate attention, but doesn't stop the application.
 * @property {number} critical - The highest severity level, indicating a critical failure that likely causes the application to stop.
 */
const levels = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
};

/**
 * Converts the log level string to a corresponding numerical value.
 * 
 * @param {string} str - The log level as a string (e.g., 'debug', 'info', 'error', 'warning' or 'critical').
 * @returns {number} The numerical value representing the log level.
 */
function getLevel(str) {
  const level = levels[str.toLowerCase()];
  return level !== undefined ? level : 3;
}

const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Helper function to retry an operation multiple times.
 * 
 * @param {Function} operation - The operation to retry (should return a promise).
 * @param {number} retries - The number of retries left.
 * @returns {Promise<void>} A promise that resolves if the operation succeeds, or rejects after all retries fail.
 */
async function retryOperation(operation, retries = RETRY_LIMIT) {
  try {
    await operation();
  } catch (err) {
    if (retries > 0) {
      console.warn(`Operation failed, retrying... Attempts left: ${retries}. Error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      await retryOperation(operation, retries - 1);
    } else {
      console.error(`Operation failed after ${RETRY_LIMIT} attempts. Error: ${err.message}`);
      throw err;
    }
  }
}

/**
 * Logger class that handles logging messages to a file with different log levels and log rotation.
 */
class Logger {
  /**
   * Creates an instance of Logger.
   * 
   * @param {string} level - The minimum log level for the logger (e.g., 'debug', 'info', 'warning', 'critical').
   * @param {number} [maxSize=5*1024*1024] - The maximum size of the log file before rotation occurs, in bytes.
   * @param {number} [maxBackups=5] - The maximum number of backup log files to retain.
   */
  constructor(level, maxSize = 5 * 1024 * 1024, maxBackups = 5) {
    this._threshold = getLevel(level);
    this._logDir = path.join(__dirname, '..', 'logs');
    this._baseLogFile = path.join(this._logDir, 'customradio.log');
    this._maxSize = maxSize;
    this._maxBackups = maxBackups;

    if (!fs.existsSync(this._logDir)) {
      fs.mkdirSync(this._logDir, {
        recursive: true
      });
    }

    retryOperation(() => this._initializeLogFile()).catch((err) => {
      console.error(`${this.timestamp()} [CRITICAL] Failed to initialize log file: ${err.message}`);
      process.exit(1);
    });

    this._logQueue = Promise.resolve();
  }

  /**
   * Logs a debug message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async debug(message) {
    await this._log(this.timestamp(), 'DEBUG', message);
  }

  /**
   * Logs an info message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async info(message) {
    await this._log(this.timestamp(), 'INFO', message);
  }
  
  /**
   * Logs a warning message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async warning(message) {
    await this._log(this.timestamp(), 'WARNING', message);
  }

  /**
   * Logs an error message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async error(message) {
    await this._log(this.timestamp(), 'ERROR', message);
  }

  /**
   * Logs a critical message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async critical(message) {
    await this._log(this.timestamp(), 'CRITICAL', message);
  }

  /**
   * Generates a timestamp string for the current date and time.
   * 
   * @returns {string} The formatted timestamp.
   */
  timestamp() {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return formatter.format(new Date());
  }

  /**
   * Writes a log entry to the log file sequentially by chaining log operations.
   * 
   * @param {string} timestamp - The timestamp of the log entry.
   * @param {string} level - The log level (e.g., 'debug', 'info', 'warning', 'critical').
   * @param {string} message - The log message.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async _log(timestamp, level, message) {
    if (this._threshold > levels[level.toLowerCase()]) {
      return;
    }
    if (typeof message === 'object') {
      message = JSON.stringify(message, null, 2);
    }
    const logEntry = `${timestamp} [${level}] ${message}`;
    
    console.log(logEntry);

    await this._rotateLogFile();

    this._logQueue = this._logQueue.then(() => {
      return appendFile(this._baseLogFile, `${logEntry}\n`).catch((err) => {
        const errorMessage = `Failed to write log entry: ${err.message}`;
        console.error(`${this.timestamp()} [CRITICAL] ${errorMessage}`);
        throw new Error(errorMessage);
      });
    });
  }

  /**
   * Initializes the log file by ensuring it exists and is empty.
   * 
   * @returns {Promise<void>} A promise that resolves when the log file is initialized.
   */
  async _initializeLogFile() {
    try {
      await appendFile(this._baseLogFile, '');
    } catch (err) {
      throw new Error(`Failed to initialize log file: ${err.message}`);
    }
  }

  /**
   * Rotates the log file when its size exceeds the maximum allowed size.
   * 
   * @returns {Promise<void>} A promise that resolves when the log file is rotated.
   */
  async _rotateLogFile() {
    try {
      const stats = await stat(this._baseLogFile);

      if (stats.size > this._maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveFile = path.join(this._logDir, `customradio-${process.pid}-${timestamp}.log`);

        // Use retry logic for renaming the log file
        await retryOperation(() => rename(this._baseLogFile, archiveFile));

        this._removeOldLogFiles();

        // Use retry logic for initializing a new log file after rotation
        await retryOperation(() => this._initializeLogFile());
      }
    } catch (err) {
      console.error(`${this.timestamp()} [CRITICAL] Failed to check log file size: ${err.message}`);
    }
  }

  /**
   * Removes old log files to maintain the maximum number of backups.
   * 
   * @returns {void}
   */
  async _removeOldLogFiles() {
    try {
      const logFiles = (await readdir(this._logDir))
        .filter(file => file.startsWith('customradio-') && file.endsWith('.log'))
        .map(file => path.join(this._logDir, file));

      const fileStats = await Promise.all(logFiles.map(file => fsPromises.stat(file)));
      logFiles.sort((a, b) => fileStats[logFiles.indexOf(a)].birthtimeMs - fileStats[logFiles.indexOf(b)].birthtimeMs);
      

      while (logFiles.length > this._maxBackups) {
        const fileToDelete = logFiles.shift();
        await unlink(fileToDelete);
        this.info(`Deleted old log file: ${fileToDelete}`);
      }
    } catch (err) {
      console.error(`${this.timestamp()} [CRITICAL] Failed to remove old log files: ${err.message}`);
    }
  }
}

module.exports = Logger;
