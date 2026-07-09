require("dotenv").config();
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const logger = require("./logger");

class AWSSecretsManager {
  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_DEFAULT_REGION || "us-east-1",
    });
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000;
  }

  /**
   * Gets a secret from AWS Secrets Manager
   * @param {string} secretName - Secret name in AWS Secrets Manager
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<string>} - Secret value
   */
  async getSecret(secretName, useCache = true) {
    try {
      if (useCache && this.cache.has(secretName)) {
        const cached = this.cache.get(secretName);
        if (Date.now() - cached.timestamp < this.cacheTTL) {
          return cached.value;
        }
        this.cache.delete(secretName);
      }

      const response = await this.client.send(
        new GetSecretValueCommand({
          SecretId: secretName,
          VersionStage: "AWSCURRENT",
        })
      );

      let secretValue = response.SecretString;

      try {
        const parsed = JSON.parse(secretValue);
        if (parsed.privateKey) {
          secretValue = parsed.privateKey;
        } else if (parsed.key) {
          secretValue = parsed.key;
        } else if (parsed.value) {
          secretValue = parsed.value;
        }
      } catch {
        //
      }

      if (useCache) {
        this.cache.set(secretName, {
          value: secretValue,
          timestamp: Date.now(),
        });
      }

      return secretValue;
    } catch (error) {
      logger.error(`Error fetching secret ${secretName}:`, error);
      throw new Error(
        `Failed to retrieve secret ${secretName}: ${error.message}`
      );
    }
  }
}

module.exports = new AWSSecretsManager();
