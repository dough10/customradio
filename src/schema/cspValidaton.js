const { body } = require('express-validator');

/**
 * enviroment options for csp report. 
 * allows localhost as url when not in production.
 * 
 * @returns {undefined|String}
 */
const envOptions = (_ => {
  const option = {
    require_tld: false,
    require_protocol: true,
    require_port: true
  };
  return process.env.NODE_ENV === 'production' ? undefined : option; 
})();

module.exports = [
  body('csp-report')
    .isObject()
    .withMessage('csp-report must be an object'),
  body('csp-report.referrer')
    .optional()
    .custom(value => {
    if (value === '' || value === null) return true;
    return validator.isURL(value, envOptions);
  }).withMessage('referrer must be a valid URL'),
  body('csp-report.violated-directive')
    .escape()
    .isString()
    .withMessage('violated-directive must be a string'),
  body('csp-report.original-policy')
    .escape()
    .isString()
    .withMessage('original-policy must be a string'),
];