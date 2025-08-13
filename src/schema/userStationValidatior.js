const { body } = require('express-validator');

const stationValidation = [
  body('id')
    .exists().withMessage('Station id is required')
    .isLength({ min: 1 }).withMessage('Station id cannot be empty')
    .trim()
    .escape(),
  body('url')
    .exists().withMessage('Station url is required')
    .isURL().withMessage('Station url must be a valid URL')
    .trim(),
  body('name')
    .exists().withMessage('Station name is required')
    .isLength({ min: 1 }).withMessage('Station name cannot be empty')
    .trim()
    .escape(),
  body('genre')
    .optional()
    .isString()
    .trim()
    .escape(),
];

module.exports = stationValidation;