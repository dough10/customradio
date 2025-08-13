const { query } = require('express-validator');

module.exports = [
  query('genres')
    .trim()
    .escape()
    .isString()
    .withMessage('Genres must be a string'),
];