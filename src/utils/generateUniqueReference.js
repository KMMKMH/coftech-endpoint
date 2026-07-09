const crypto = require("crypto");
const repoPayments = require("../repositories/payments");

function generateShortUniqueReference() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${date}${randomPart}`;
}

async function getUniqueReference() {
  for (let i = 0; i < 5; i++) {
    const reference = generateShortUniqueReference();
    const [exists] = await repoPayments.getPaymentsByField({
      "payments.reference": reference,
    });
    if (!exists) {
      return reference;
    }
  }
  throw new Error(
    "Unable to generate a unique reference after multiple attempts"
  );
}

module.exports = { generateShortUniqueReference, getUniqueReference };
