const isParsable = (str) => {
  if (str === null || str === undefined) {
    return false;
  }
  if (typeof str !== "string") {
    return false;
  }
  if (!str.trim()) {
    return false;
  }

  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    console.error(`Error parsing JSON: ${e}`);
    return false;
  }
};

module.exports = { isParsable };
