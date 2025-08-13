const { body } = require('express-validator');

module.exports = [
  body('url')
    .isURL()
    .notEmpty()
    .withMessage('Invalid URL')
];