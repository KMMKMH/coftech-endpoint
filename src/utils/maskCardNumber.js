function maskCardNumber(cardNumber) {
  cardNumber = String(cardNumber);

  const firstTwo = cardNumber.slice(0, 2);
  const lastFour = cardNumber.slice(-4);

  const asteriskCount = cardNumber.length - 6;

  return `${firstTwo}${"*".repeat(asteriskCount)}${lastFour}`;
}

module.exports = { maskCardNumber };
