# Validation Scripts

## Error Code Validation

### validate-error-codes.js

This script validates that every `ErrorCodes` key used in the code exists in `src/constants/errorCodes.js`.

#### Usage

The script runs as part of linting:

```bash
npm run lint
```

Or directly:

```bash
node scripts/validate-error-codes.js
```

#### What It Validates

- Finds every `ErrorCodes.UPPERCASE_KEY` usage in JavaScript files under `src/`.
- Verifies that each discovered key exists in the object exported by `src/constants/errorCodes.js`.

#### CI/CD Integration

Because it is included in the `lint` command, this script runs in any CI/CD workflow that uses that command.

#### Successful Output Example

```text
Validating ErrorCodes key usage...

Total keys found: 45
Files analyzed: 67

All used ErrorCodes keys are valid.
```

#### Error Output Example

```text
Validating ErrorCodes key usage...

Total keys found: 45
Files analyzed: 67

1 invalid keys found:

File: src/controllers/auth.js
   Invalid key: "AUTH_INVALID_CREDENTIAL"
```

#### Adding New Error Codes

1. Add the new key and value to `src/constants/errorCodes.js`.
2. Use the new key through the imported object, for example `ErrorCodes.NEW_KEY`.
3. Run `npm run lint` to confirm the key is valid.

#### Technical Notes

- The script scans all `.js` files under `src/`.
- It ignores `src/constants/errorCodes.js` to avoid false positives.
- The exit code is `0` when everything is valid and `1` when invalid keys are found.
