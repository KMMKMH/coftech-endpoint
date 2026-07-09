const generateDictionary = (secretKey) => {
  const dictionary = {};
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let seed = Array.from(secretKey).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );

  function seededRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  for (let i = 0; i <= 9; i++) {
    let randomCombo = "";
    for (let j = 0; j < 2; j++) {
      randomCombo += letters[Math.floor(seededRandom() * letters.length)];
    }
    dictionary[i] = randomCombo;
  }

  return dictionary;
};

const encrypt = (number, secret) => {
  const dictionary = generateDictionary(secret);

  return number
    .toString()
    .split("")
    .map((digit) => dictionary[digit])
    .join("");
};

const decrypt = (text, secret) => {
  const dictionary = generateDictionary(secret);
  const reverseDictionary = Object.fromEntries(
    Object.entries(dictionary).map(([key, value]) => [value, key])
  );

  const decryptedArray = [];
  for (let i = 0; i < text.length; i += 2) {
    const pair = text.substring(i, i + 2);
    decryptedArray.push(reverseDictionary[pair]);
  }
  return decryptedArray.join("");
};

module.exports = {
  encrypt,
  decrypt,
};
