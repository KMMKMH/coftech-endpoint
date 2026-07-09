#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Running linter...');

try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ Linter passed!');
  process.exit(0);
} catch {
  console.error('❌ Linter failed. Please fix the errors before committing.');
  process.exit(1);
}
