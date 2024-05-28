// validators/talentValidator.js

const { check, validationResult } = require('express-validator');

const validateTalent = [
    check('name').notEmpty().withMessage('Name is required'),
    check('country').notEmpty().withMessage('Country is required'),
    check('skillSet').notEmpty().withMessage('Skill set is required'),
    check('level').notEmpty().withMessage('Professional level is required'),
    check('gender').notEmpty().withMessage('Gender is required'),
    check('portfolio').notEmpty().withMessage('Portfolio link is required'),
];

module.exports = { validateTalent, validationResult };