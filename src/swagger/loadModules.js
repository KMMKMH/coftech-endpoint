const fs = require("fs");
const path = require("path");

const loadModules = (directory) => {
  const paths = {};

  fs.readdirSync(directory).forEach((file) => {
    if (file.endsWith(".js")) {
      const filePath = path.join(directory, file);
      const moduleContent = require(filePath);
      Object.assign(paths, moduleContent);
    }
  });

  return paths;
};

module.exports = loadModules;
