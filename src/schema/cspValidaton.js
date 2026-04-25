const { body } = require('express-validator');

const generalError = 'Invalid CSP report field';

module.exports = [
  body('csp-report')
    .exists()
    .withMessage('csp-report is required')
    .isObject()
    .withMessage('csp-report must be an object'),

  body('csp-report.document-uri')
    .optional()
    .isString()
    .withMessage(generalError),

  body('csp-report.referrer')
    .optional()
    .isString()
    .withMessage(generalError),

  body('csp-report.violated-directive')
    .optional()
    .isString()
    .withMessage(generalError),

  body('csp-report.effective-directive')
    .optional()
    .isString()
    .withMessage(generalError),

  body('csp-report.original-policy')
    .optional()
    .isString()
    .withMessage(generalError),

  body('csp-report.disposition')
    .optional()
    .isString()
    .withMessage(generalError),

  body('csp-report.blocked-uri')
    .optional()
    .isString()
    .withMessage(generalError),

  body('csp-report.source-file')
    .optional()
    .isString()
    .withMessage(generalError),

  body('csp-report.script-sample')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage(generalError),

  body('csp-report.status-code')
    .optional()
    .isInt()
    .withMessage(generalError),

  body('csp-report.line-number')
    .optional()
    .isInt()
    .withMessage(generalError),

  body('csp-report.column-number')
    .optional()
    .isInt()
    .withMessage(generalError),
];