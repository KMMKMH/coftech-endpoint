#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const glob = require("glob");

const errorCodes = require("../src/constants/errorCodes.js");
const validErrorKeys = Object.keys(errorCodes);

/**
 * Finds all used keys that follow the ErrorCodes.UPPERCASE_KEY pattern.
 * @param {string} content File content.
 * @returns {string[]}
 */
function findErrorKeys(content) {
  const regex = /ErrorCodes\.([A-Z_]+)/g;
  const keys = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

console.log("Validating ErrorCodes key usage...\n");

const files = glob.sync("src/**/*.js", {
  cwd: path.join(__dirname, ".."),
  ignore: "src/constants/errorCodes.js",
});

let totalKeysFound = 0;
let errors = [];

files.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  const content = fs.readFileSync(filePath, "utf8");
  const keysInFile = findErrorKeys(content);

  if (keysInFile.length > 0) {
    keysInFile.forEach((key) => {
      totalKeysFound++;
      if (!validErrorKeys.includes(key)) {
        errors.push({
          file,
          key,
          reason: "The key does not exist in src/constants/errorCodes.js",
        });
      }
    });
  }
});

console.log(`Total keys found: ${totalKeysFound}`);
console.log(`Files analyzed: ${files.length}\n`);

if (!errors.length) {
  console.log("All used ErrorCodes keys are valid.\n");
  process.exit(0);
} else {
  console.log(`${errors.length} invalid keys found:\n`);

  errors.forEach((error, index) => {
    console.log(`File: ${error.file}`);
    console.log(`   Invalid key: "${error.key}"`);

    if (index < errors.length - 1) {
      console.log();
    }
  });

  console.log("\n");
  process.exit(1);
}
