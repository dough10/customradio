const { body } = require('express-validator');

module.exports = [
  body('id')
    .trim()
    .escape()
    .isString()
    .notEmpty()
    .withMessage('Invalid ID paramater')
];