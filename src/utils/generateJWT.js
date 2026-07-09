const jwt = require("jsonwebtoken");

const generateJWT = (iss, extras, secret, expiresIn) => {
  return jwt.sign(
    {
      iss: iss,
      aud: "https://coftech-backend-api.coftechservices.com/",
      sub: "notifications@coftechservices.com",
      ...extras,
    },
    secret,
    expiresIn
  );
};

module.exports = {
  generateJWT,
};
