const emailExistence = require("email-existence");

const validateEmail = async (email) => {
  try {
    return await new Promise((resolve) => {
      emailExistence.check(email, function (error, response) {
        if (error) {
          resolve(false);
        } else {
          resolve(response);
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = { validateEmail };
