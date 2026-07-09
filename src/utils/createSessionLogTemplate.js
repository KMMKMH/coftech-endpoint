function generateSessionEventLog(type = null, author = null, details = {}) {
  return {
    type,
    author,
    timestamp: new Date().toISOString(),
    details,
  };
}

module.exports = {
  generateSessionEventLog,
};
