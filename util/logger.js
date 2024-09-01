const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logFile = path.join(__dirname, '..', 'logs', new Date().toLocaleString() + '.log');
    fs.appendFile(this.logFile, '', (err) => {
      if (err) throw err;
    });
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} [${level}] ${message}\n`;
  }
}