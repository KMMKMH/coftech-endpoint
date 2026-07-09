const ShortUniqueId = require("short-unique-id");

const generateToken = (length) => {
  const uid = new ShortUniqueId({ length });

  return uid.rnd();
};

module.exports = generateToken;