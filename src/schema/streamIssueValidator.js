const { body } = require('express-validator');

module.exports = [
  body('id')
    .trim()
    .escape()
    .isString()
    .notEmpty()
    .withMessage('Invalid or missing ID paramater'),
  body('error')
    .trim()
    .escape()
    .isString()
    .notEmpty()
    .withMessage('Error meessage must be a string')
];