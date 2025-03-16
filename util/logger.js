const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = require('fs');
const { appendFile, stat, rename, readdir, unlink} = fsPromises;

/**
 * Converts the log level string to a corresponding numerical value.
 * 
 * @param {string} str - The log level as a string (e.g., 'debug', 'info', 'error', 'warning' or 'critical').
 * @returns {number} The numerical value representing the log level.
 */
function getLevel(str) {
  if (typeof str !== 'string') {
    console.log('using default(error) log level');
    return 3;
  }
  switch (str.toLowerCase()) {
    case 'debug':
      return 0;
    case 'info':
      return 1;
    case 'warning':
      return 2;
    case 'error':
      return 3;
    case 'critical':
      return 4;
    default:
      console.log('using default(error) log level');
      return 3;
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
      fs.mkdirSync(this._logDir);
    }

    this._initializeLogFile();

    this._logQueue = Promise.resolve();
  }

  /**
   * Logs a debug message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async debug(message) {
    if (this._threshold <= 0) await this._log(this._timestamp(), 'DEBUG', message);
  }

  /**
   * Logs an info message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async info(message) {
    if (this._threshold <= 1) await this._log(this._timestamp(), 'INFO', message);
  }
  
  /**
   * Logs a warning message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async warning(message) {
    if (this._threshold <= 2) await this._log(this._timestamp(), 'WARNING', message);
  }

  /**
   * Logs an error message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async error(message) {
    if (this._threshold <= 3) await this._log(this._timestamp(), 'ERROR', message);
  }

  /**
   * Logs a critical message if the current log level allows it.
   * 
   * @param {string} message - The message to log.
   * @returns {Promise<void>} A promise that resolves when the log entry is written.
   */
  async critical(message) {
    await this._log(this._timestamp(), 'CRITICAL', message);
  }

  /**
   * Generates a timestamp string for the current date and time.
   * 
   * @returns {string} The formatted timestamp.
   */
  _timestamp() {
    return new Date().toLocaleString();
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
    if (typeof message === 'object') {
      message = JSON.stringify(message, null, 2);
    }
    const logEntry = `${timestamp} [${level}] ${message}`;
    console.log(logEntry);

    await this._rotateLogFile();

    this._logQueue = this._logQueue.then(() => {
      return appendFile(this._baseLogFile, `${logEntry}\n`).catch((err) => {
        console.error(`${this._timestamp()} [CRITICAL] Failed to write log entry: ${err.message}`);
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
      console.error(`${this._timestamp()} [CRITICAL] Failed to initialize log file: ${err.message}`);
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
        const archiveFile = path.join(this._logDir, `customradio-${timestamp}.log`);

        await rename(this._baseLogFile, archiveFile);

        this._removeOldLogFiles();

        await this._initializeLogFile();
      }
    } catch (err) {
      console.error(`${this._timestamp()} [CRITICAL] Failed to check log file size: ${err.message}`);
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

      logFiles.sort((a, b) => fs.statSync(a).birthtimeMs - fs.statSync(b).birthtimeMs);

      while (logFiles.length > this._maxBackups) {
        const fileToDelete = logFiles.shift();
        await unlink(fileToDelete);
        this.info(`Deleted old log file: ${fileToDelete}`);
      }
    } catch (err) {
      console.error(`${this._timestamp()} [CRITICAL] Failed to remove old log files: ${err.message}`);
    }
  }
}

module.exports = Logger;
