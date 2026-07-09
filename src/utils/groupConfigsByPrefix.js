/**
 * Groups bot configurations by their key prefix.
 * - Groups by common prefix (e.g., WEEKLY_REPORT_CRON, WEEKLY_REPORT_ENABLED -> WEEKLY_REPORT)
 * - Sorts configs within groups: booleans first, then alphabetically
 * - Adds company_id and bot_id to each group
 *
 * @param {Array} configs - Array of bot configuration objects
 * @param {string} companyId - Company UUID
 * @param {string} botId - Bot UUID
 * @returns {Array} Grouped configurations with company_id and bot_id
 */

const findCommonPrefix = (key, configs) => {
  const parts = key.split("_");
  if (parts.length === 1) return key;

  for (let i = parts.length - 1; i > 0; i--) {
    const prefix = parts.slice(0, i).join("_");
    const hasMatch = configs.some(
      (c) => c.template_key !== key && c.template_key.startsWith(`${prefix}_`)
    );
    if (hasMatch) return prefix;
  }
  return key;
};

const sortConfigs = (configs) =>
  configs.sort((a, b) => {
    if (a.type === "boolean" && b.type !== "boolean") return -1;
    if (a.type !== "boolean" && b.type === "boolean") return 1;
    return a.name.localeCompare(b.name);
  });

const groupConfigsByPrefix = (configs, companyId, botId) => {
  if (!configs?.length) return [];

  const groupedMap = new Map();

  configs.forEach((config) => {
    const {
      uuid_unique,
      config_template_id,
      template_key,
      template_name,
      template_data_type,
      template_data_options,
      template_description,
      template_internal,
      data,
    } = config;

    const prefix = findCommonPrefix(template_key, configs);

    if (!groupedMap.has(prefix)) {
      groupedMap.set(prefix, {
        uuid_unique: config_template_id,
        configs: [],
      });
    }

    const group = groupedMap.get(prefix);
    if (group.configs.length === 0) {
      group.uuid_unique = config_template_id;
    }

    group.configs.push({
      id: uuid_unique,
      name: template_name,
      key: template_key,
      data: data,
      type: template_data_type,
      description: template_description,
      options: template_data_options,
      internal: template_internal || 0,
    });
  });

  return Array.from(groupedMap.values())
    .map((group) => ({
      uuid_unique: group.uuid_unique,
      company_id: companyId,
      bot_id: botId,
      configs: sortConfigs(group.configs),
    }))
    .sort((a, b) => a.configs[0]?.name.localeCompare(b.configs[0]?.name));
};

module.exports = { groupConfigsByPrefix };
