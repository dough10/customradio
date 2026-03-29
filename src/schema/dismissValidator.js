const { body } = require('express-validator');

module.exports = [
  body('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('ID must be a string'),

  body('version')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('version must be a string'),
];