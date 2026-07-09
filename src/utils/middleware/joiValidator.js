const ErrorCodes = require('../../constants/errorCodes');
const { ApiError } = require('../errors/ApiError');

/**
 * Validates data with a Joi schema and throws if validation fails
 * Replaces the pattern: validate() -> if (error) -> throw
 *
 * @param {Joi.Schema} schema - Joi schema
 * @param {any} data - Data to validate (req.body, req.query, etc.)
 * @param {object} options - Joi validation options
 * @returns {any} Validated and transformed data
 * @throws {ApiError} Error with VALIDATION_ERROR code
 *
 * @example
 * // Before
 * const { error } = schema.validate(req.body);
 * if (error) throw createError(400, error.details[0].message);
 *
 * // After
 * validateOrThrow(schema, req.body);
 */
function validateOrThrow(schema, data, options = {}) {
  const defaultOptions = {
    abortEarly: false,      // Return all errors
    allowUnknown: false,    // Do not allow extra fields
    stripUnknown: true,     // Remove extra fields
    ...options,
  };

  const { error, value } = schema.validate(data, defaultOptions);

  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type,
    }));

    throw ApiError(
      400,
      'Validation failed',
      ErrorCodes.VALIDATION_ERROR,
      { errors: validationErrors }
    );
  }

  return value;
}


module.exports = {
  validateOrThrow
};
