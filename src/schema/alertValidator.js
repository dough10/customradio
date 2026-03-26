const { body } = require('express-validator');

module.exports = [
  body('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('ID must be a string'),

  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('title must be a string'),

  body('paragraphs')
    .isArray({ min: 1 })
    .withMessage('paragraphs must be a non-empty array'),

  body('paragraphs.*')
    .isString()
    .notEmpty()
    .withMessage('each paragraph must be a non-empty string'),

  body('expiresAt')
    .optional()
    .toInt()
    .isInt({ min: 0 })
    .withMessage('expiresAt must be a valid timestamp')
    .custom((value) => {
      const now = Date.now();
      const max = now + 1000 * 60 * 60 * 24 * 365;

      if (value < now) {
        throw new Error('expiresAt must be in the future');
      }

      if (value > max) {
        throw new Error('expiresAt is too far in the future');
      }

      return true;
    })
];