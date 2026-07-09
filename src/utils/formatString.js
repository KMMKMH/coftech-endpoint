const formatString = (template, values, tKey) => {
  try {
    return template.replace(/{(\w+)}/g, (_, key) => {
      if (!(key in values)) {
        throw new Error(`Variable '${key}' no encontrada en valores (formatString) para traducir.`);
      }
      return values[key] ?? "";
    });
  } catch (error) {
    throw new Error(`${error.message}. Received values: ${JSON.stringify(values)}. For translation key: ${tKey}`);
  }
};

module.exports = {
  formatString,
};
