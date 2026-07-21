import { validationResult, body } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Input format is incorrect.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

export const registerRiderValidationRules = [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('phone').matches(/^\+?[0-9\s-]{8,20}$/).withMessage('Please enter a valid phone number.'),
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters.'),
  body('passwordHash').isLength({ min: 6 }).withMessage('Password hash must be at least 6 characters.'),
  body('username').trim().toLowerCase().matches(/^[a-z0-9_.-]+$/).withMessage('Username can contain letters, numbers, underscores, periods, and hyphens.')
];

export const loginValidationRules = [
  body('username').trim().notEmpty().withMessage('Username or Email is required.'),
  body('password').notEmpty().withMessage('Password is required.')
];
