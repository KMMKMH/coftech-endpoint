const createError = require("http-errors");
const logger = require("../logger");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err);
  const isHttpError = err instanceof createError.HttpError;
  const statusCode = isHttpError ? err.statusCode : 500;

  const errorCode =
    err.code ||
    (isHttpError ? `HTTP_ERROR_${statusCode}` : "INTERNAL_SERVER_ERROR");

  const message = isHttpError ? err.message : "Internal Server Error";

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      status: false,
      statusCode,
      ...(err.metadata && { metadata: err.metadata }),
    },
    ...(process.env.ENVIRONMENT === "development" && {
      stack: err.stack
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("at "))
        .map((l) => l.replace(process.cwd(), ".")),
    }),
  });
};

module.exports = errorHandler;
