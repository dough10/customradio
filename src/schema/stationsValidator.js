const { query } = require('express-validator');

module.exports = [
  query('genres')
    .trim()
    .isString()
    .withMessage('Genres must be a string'),
];