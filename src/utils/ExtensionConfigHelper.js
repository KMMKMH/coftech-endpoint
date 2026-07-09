/**
 * Helper object for extension configuration manipulation
 * Provides utility functions to manage extension configurations arrays
 */
const ExtensionConfigHelper = {
  /**
   * Find the index of a configuration key in an extension
   * @param {Object} extension - The extension object
   * @param {string} configKey - The configuration key to find
   * @returns {number} The index of the key, or -1 if not found
   */
  findConfigIndex(extension, configKey) {
    return extension.config_keys.findIndex((key) => key === configKey);
  },

  /**
   * Initialize arrays if they don't exist or are incomplete
   * @param {Object} extension - The extension object to initialize
   */
  initializeArrays(extension) {
    const length = extension.config_keys.length;

    if (!Array.isArray(extension.config_data_trigger)) {
      extension.config_data_trigger = Array(length).fill(null);
    }
    if (!Array.isArray(extension.config_data_extra)) {
      extension.config_data_extra = Array(length).fill(null);
    }
    if (!Array.isArray(extension.config_data_types)) {
      extension.config_data_types = Array(length).fill("string");
    }
    if (!Array.isArray(extension.config_data_options)) {
      extension.config_data_options = Array(length).fill(null);
    }
    if (!Array.isArray(extension.config_descriptions)) {
      extension.config_descriptions = Array(length).fill("");
    }
    if (!Array.isArray(extension.config_datas)) {
      extension.config_datas = Array(length).fill("");
    }
  },

  /**
   * Update an existing configuration at a specific index
   * @param {Object} extension - The extension object
   * @param {number} index - The index to update
   * @param {Object} config - Configuration object with properties to update
   */
  updateConfig(extension, index, config) {
    if (config.key !== undefined) extension.config_keys[index] = config.key;
    if (config.type !== undefined)
      extension.config_data_types[index] = config.type;
    if (config.data !== undefined) extension.config_datas[index] = config.data;
    if (config.description !== undefined)
      extension.config_descriptions[index] = config.description;
    if (config.options !== undefined)
      extension.config_data_options[index] = config.options;
    if (config.trigger !== undefined)
      extension.config_data_trigger[index] = config.trigger;
    if (config.extra !== undefined)
      extension.config_data_extra[index] = config.extra;
  },

  /**
   * Add a new configuration to the end of the arrays
   * @param {Object} extension - The extension object
   * @param {Object} config - Configuration object to add
   */
  addConfig(extension, config) {
    this.initializeArrays(extension);

    extension.config_keys.push(config.key);
    extension.config_data_types.push(config.type || "string");
    extension.config_datas.push(config.data || "");
    extension.config_descriptions.push(config.description || "");
    extension.config_data_options.push(config.options || null);
    extension.config_data_trigger.push(config.trigger || null);
    extension.config_data_extra.push(config.extra || null);
  },

  /**
   * Insert a configuration at a specific index
   * @param {Object} extension - The extension object
   * @param {number} index - The index where to insert
   * @param {Object} config - Configuration object to insert
   */
  insertConfig(extension, index, config) {
    this.initializeArrays(extension);

    extension.config_keys.splice(index, 0, config.key);
    extension.config_data_types.splice(index, 0, config.type || "string");
    extension.config_datas.splice(index, 0, config.data || "");
    extension.config_descriptions.splice(index, 0, config.description || "");
    extension.config_data_options.splice(index, 0, config.options || null);
    extension.config_data_trigger.splice(index, 0, config.trigger || null);
    extension.config_data_extra.splice(index, 0, config.extra || null);
  },

  /**
   * Update existing config or add new one if it doesn't exist
   * @param {Object} extension - The extension object
   * @param {string} configKey - The configuration key
   * @param {Object} config - Configuration object
   */
  upsertConfig(extension, configKey, config) {
    const index = this.findConfigIndex(extension, configKey);
    if (index !== -1) {
      this.updateConfig(extension, index, { ...config, key: configKey });
    } else {
      this.addConfig(extension, { ...config, key: configKey });
    }
  },

  /**
   * Remove a configuration by key
   * @param {Object} extension - The extension object
   * @param {string} configKey - The configuration key to remove
   * @returns {boolean} True if removed, false if not found
   */
  removeConfig(extension, configKey) {
    const index = this.findConfigIndex(extension, configKey);
    if (index === -1) return false;

    extension.config_keys.splice(index, 1);
    extension.config_data_types.splice(index, 1);
    extension.config_datas.splice(index, 1);
    extension.config_descriptions.splice(index, 1);
    extension.config_data_options.splice(index, 1);
    extension.config_data_trigger.splice(index, 1);
    extension.config_data_extra.splice(index, 1);

    return true;
  },

  /**
   * Check if a configuration key exists
   * @param {Object} extension - The extension object
   * @param {string} configKey - The configuration key to check
   * @returns {boolean} True if exists, false otherwise
   */
  hasConfig(extension, configKey) {
    return this.findConfigIndex(extension, configKey) !== -1;
  },
};

module.exports = ExtensionConfigHelper;
