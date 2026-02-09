const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  profile: Joi.object({
    fullName: Joi.string().min(2).max(255).required().messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name cannot exceed 255 characters',
      'any.required': 'Full name is required'
    }),
    dateOfBirth: Joi.date().max('now').required().messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required'
    }),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow(''),
    geneticConditions: Joi.string().max(2000).allow(''),
    knownAllergies: Joi.string().max(2000).required().messages({
      'any.required': 'Known allergies information is required (enter "None" if no allergies)'
    }),
    currentSymptoms: Joi.string().max(2000).allow(''),
    location: Joi.string().min(2).max(255).required().messages({
      'string.min': 'Location must be at least 2 characters',
      'any.required': 'Location is required'
    })
  }),

  child: Joi.object({
    name: Joi.string().min(1).max(255).required().messages({
      'string.min': 'Child name is required',
      'any.required': 'Child name is required'
    }),
    dateOfBirth: Joi.date().max('now').required().messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required'
    }),
    gender: Joi.string().valid('Male', 'Female', 'Other').required(),
    birthWeight: Joi.number().positive().max(10).allow(null),
    birthComplications: Joi.string().max(2000).allow('')
  }),

  vaccine: Joi.object({
    childId: Joi.string().uuid().allow(null),
    vaccineId: Joi.string().uuid().required(),
    administeredDate: Joi.date().max('now').required(),
    healthcareProvider: Joi.string().max(255).allow(''),
    batchNumber: Joi.string().max(100).allow(''),
    notes: Joi.string().max(1000).allow('')
  })
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: 'Validation schema not found' });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    req.validatedData = value;
    next();
  };
};

// Sanitization helpers
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 10000); // Limit length
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

module.exports = {
  validate,
  sanitize,
  schemas
};