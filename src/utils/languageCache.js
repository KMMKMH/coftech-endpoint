const supportedLanguages = new Set();

function setSupportedLanguages(langs) {
  langs.forEach((lang) => supportedLanguages.add(lang));
}

function getSupportedLanguages() {
  return supportedLanguages;
}

module.exports = {
  setSupportedLanguages,
  getSupportedLanguages,
};
