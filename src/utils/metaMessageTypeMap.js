const typeMap = {
  text: "chat",
  audio: "ptt",
};

function mapMessageType(type) {
  const key = String(type);
  return typeMap[key] || key || "unknown";
}

module.exports = { mapMessageType };
