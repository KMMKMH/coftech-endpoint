#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('Checking for console.log statements...');

try {
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(file => file);

  if (stagedFiles.length === 0) {
    console.log('✅ No files to check.');
    process.exit(0);
  }

  const filesWithConsoleLog = [];

  for (const file of stagedFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/console\.log/.test(content)) {
        filesWithConsoleLog.push(file);
      }
    }
  }

  if (filesWithConsoleLog.length > 0) {
    console.error('❌ Error: console.log found in the following files:');
    filesWithConsoleLog.forEach(file => console.error(`  - ${file}`));
    console.error('');
    console.error('Please remove console.log statements before pushing.');
    process.exit(1);
  }

  console.log('✅ No console.log statements found!');
  process.exit(0);
} catch (error) {
  console.error('Error checking files:', error.message);
  process.exit(1);
}
