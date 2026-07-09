const createError = require("http-errors");

/**
 * Creates a custom HTTP error with an error code.
 *
 * @param {number} statusCode - HTTP code (400, 404, 500, etc.)
 * @param {string} message - Technical message in English.
 * @param {string} code - Error code from errorCodes.js.
 * @param {object} metadata - Additional data (optional).
 * @returns {Error} HTTP error with a code.
 *
 * @example
 * throw ApiError(404, 'User not found', ErrorCodes.ACCOUNT_NOT_FOUND);
 *
 * @example
 * throw ApiError(
 *   409,
 *   'Email already exists',
 *   ErrorCodes.ACCOUNT_ALREADY_EXISTS,
 *   { email: 'user@example.com' }
 * );
 */
function ApiError(statusCode, message, code, metadata = null) {
  const error = createError(statusCode, message);
  error.code = code;
  error.metadata = metadata;
  return error;
}

module.exports = { ApiError };
