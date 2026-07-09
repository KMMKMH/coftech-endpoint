const generateChangesMetadata = (oldValues, newValues) => {
  const changes = {};

  Object.keys(newValues).forEach((key) => {
    if (oldValues[key] !== newValues[key]) {
      changes[key] = {
        before: oldValues[key],
        after: newValues[key],
      };
    }
  });

  return changes;
};

module.exports = {
  generateChangesMetadata,
};
