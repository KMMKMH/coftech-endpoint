const fs = require("fs");
const path = require("path");

const loadOperationsMetadata = (dir) => {
  const metadata = [];

  fs.readdirSync(dir).forEach((file) => {
    if (file.endsWith(".js")) {
      const operation = require(path.join(dir, file));

      Object.entries(operation).forEach(([fieldName, fieldConfig]) => {
        metadata.push({
          operationName: fieldName,
          description: fieldConfig.description || "",
          operationType: fieldConfig.operationType || "",
          extension: fieldConfig.extension || [],
        });
      });
    }
  });

  return metadata;
};

const queriesMetadata = loadOperationsMetadata(
  path.join(__dirname, "../graphql", "queries")  
);

module.exports = queriesMetadata;
