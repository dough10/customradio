/**
 * Logger interface used by MongoBase.
 *
 * @typedef {Object} Logger
 * @property {(message: string) => void} info Informational logging.
 * @property {(message: string) => void} debug Debug logging.
 * @property {(message: string) => void} warning Warning logging.
 * @property {(message: string) => void} error Error logging.
 * @property {(message: string) => void} critical Critical error logging.
 */

const log = s => console.log(s);
const err = s => console.error(s);

const defaultLogger = {
  info: log,
  debug: log,
  warning: err,
  error: err,
  critical: err
}

const required = Object.keys(defaultLogger);

function enforceLogger(logger) {
  for (const fn of required) {
    if (typeof logger[fn] !== "function")
      throw new TypeError(`logger.${fn} must be a function`);
  }
}

module.exports = { enforceLogger, defaultLogger };