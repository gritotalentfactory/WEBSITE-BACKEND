// validators/talentRequestValidator.js

const { check, validationResult } = require('express-validator');

const validateTalentRequest = [
  check('clientName').notEmpty().withMessage('Client name is required'),
  check('country').notEmpty().withMessage('Country is required'),
  check('skillSet').notEmpty().withMessage('Skill set is required'),
  check('level').notEmpty().withMessage('Professional level is required'),
  check('gender').notEmpty().withMessage('Gender is required'),
];

module.exports = { validateTalentRequest, validationResult };