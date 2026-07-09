const axios = require("axios");
const ExtensionConfigHelper = require("./ExtensionConfigHelper");
const logger = require("../utils/logger");
const { fetchChatGptModelOptions } = require("./fetchChatGptModelOptions");

/**
 * Fetches available models from OpenRouter that support both text and image input modalities.
 *
 * @returns {Promise<{ groupedByProvider: Object, optionsOpenRouters: Array, allModels: Array }>}
 * An object containing:
 * - groupedByProvider: Models grouped by provider name.
 * - optionsOpenRouters: Provider list formatted for selection UIs.
 * - allModels: A flat list of all compatible models (label/value format).
 */
async function fetchOpenRouterOptions() {
  try {
    const openrouter = await axios.get(
      "https://openrouter.ai/api/v1/models?supported_parameters=tools"
    );

    const models = openrouter.data?.data || openrouter.data;

    const filteredModels = Array.isArray(models)
      ? models.filter(
        (x) =>
          x.architecture?.input_modalities?.includes("text") &&
          x.architecture?.input_modalities?.includes("image")
      )
      : [];

    const allModels = filteredModels
      .map((x) => ({
        label: x.name,
        value: x.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const groupedByProvider = {};

    filteredModels.forEach((model) => {
      const provider = model.id.split("/")[0];
      if (!groupedByProvider[provider]) {
        groupedByProvider[provider] = [];
      }
      groupedByProvider[provider].push({
        label: model.name,
        value: model.id,
      });
    });

    const optionsOpenRouters = Object.keys(groupedByProvider).map(
      (provider) => ({
        label: provider,
        value: provider,
      })
    );

    return { groupedByProvider, optionsOpenRouters, allModels };
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error.message);
    return { groupedByProvider: {}, optionsOpenRouters: [], allModels: [] };
  }
}

/**
 * Configuration injection rules per extension type.
 * Each key represents an extension and contains its conditional config handlers.
 */
const EXTENSION_CONFIG_INJECTIONS = {
  BRAIN: {
    configs: [
      {
        condition: (extensionList) => true, //eslint-disable-line
        handler: async (extensionList) => {
          const routerSelect = await fetchOpenRouterOptions();

          let isAutoRoute = false;

          for (let i = 0; i < extensionList.config_keys.length; i++) {
            if (
              extensionList.config_keys[i] ===
              "BRAIN_OPENROUTER_USE_AUTO_ROUTER"
            ) {
              isAutoRoute = extensionList.config_datas[i] === "true";
              extensionList.config_data_trigger[i] = {
                name: extensionList.config_names[i],
                handleTrigger: "autoRoute",
                workflow: {
                  disablekeys: [
                    "BRAIN_OPENROUTER_PROVIDER",
                    "BRAIN_OPENROUTER_MODEL",
                    "BRAIN_OPENROUTER_ALTERNATIVE_MODELS",
                  ],
                },
              };
            }
          }

          for (let j = 0; j < extensionList.config_keys.length; j++) {
            if (
              extensionList.config_keys[j] ===
              "BRAIN_OPENROUTER_ALTERNATIVE_MODELS"
            ) {
              extensionList.config_data_options[j] = JSON.stringify(
                routerSelect.allModels
              );
              extensionList.config_data_extra[j] = { selectMaxItem: 3 };
              extensionList.config_datas[j] = !isAutoRoute
                ? extensionList.config_datas[j]
                : "";
            }
          }

          for (
            let index = 0;
            index < extensionList.config_keys.length;
            index++
          ) {
            if (extensionList.config_keys[index] === "BRAIN_OPENROUTER_MODEL") {
              const brainOpenRouterModel = routerSelect.allModels.find(
                (x) => x.value === extensionList.config_datas[index]
              );
              const providerModel =
                brainOpenRouterModel?.value?.split("/")[0] ?? "";

              extensionList.config_data_types[index] = "enum";
              extensionList.config_data_options[index] = JSON.stringify(
                routerSelect.groupedByProvider[providerModel] ?? []
              );
              extensionList.config_data_extra[index] = { maxWidth: "full" };
              extensionList.config_datas[index] = !isAutoRoute
                ? extensionList.config_datas[index]
                : "";

              extensionList.config_keys.splice(
                index,
                0,
                "BRAIN_OPENROUTER_PROVIDER"
              );
              extensionList.config_names.splice(
                index,
                0,
                "Brain Openrouter Provider"
              );
              extensionList.config_datas.splice(
                index,
                0,
                !isAutoRoute ? providerModel : ""
              );
              extensionList.config_descriptions.splice(
                index,
                0,
                "AI provider to be used for the bot"
              );
              extensionList.config_data_types.splice(index, 0, "enum");
              extensionList.config_data_options.splice(
                index,
                0,
                JSON.stringify(routerSelect.optionsOpenRouters)
              );
              extensionList.config_data_trigger.splice(index, 0, {
                handleTrigger: "openRoute",
                workflow: {
                  selectItems: routerSelect.groupedByProvider,
                  setKey: "BRAIN_OPENROUTER_MODEL",
                },
              });
              extensionList.config_data_extra.splice(index, 0, {
                doNotSave: true,
              });
              break;
            }
          }
        },
      },
    ],
  },
  OPEN_AI_SERVICE: {
    configs: [
      {
        condition: (extensionList) => true, // eslint-disable-line
        handler: async (extensionList, dataOptions) => {
          try {
            const { companyID } = dataOptions;
            const gptModels = await fetchChatGptModelOptions(companyID);

            const defaultModel = "gpt-4o-mini";

            const gptModelIndex = ExtensionConfigHelper.findConfigIndex(
              extensionList,
              "GPT_MODEL"
            );

            const currentValue =
              gptModelIndex !== -1
                ? extensionList.config_datas[gptModelIndex]
                : defaultModel;

            ExtensionConfigHelper.upsertConfig(extensionList, "GPT_MODEL", {
              type: "enum",
              data: currentValue,
              description: "SPECIFIC GPT MODEL",
              options: JSON.stringify(gptModels),
              trigger: null,
              extra: null,
            });
          } catch (error) {
            logger.error("Error fetching GPT models:", error);

            const fallbackModels = [
              { value: "gpt-5", label: "GPT 5" },
              { value: "gpt-5-mini", label: "GPT 5 Mini" },
              { value: "gpt-4o", label: "GPT 4o" },
              { value: "gpt-4o-mini", label: "GPT 4o Mini" },
              { value: "gpt-4.1", label: "GPT 4.1" },
              { value: "gpt-4.1-mini", label: "GPT 4.1 Mini" },
              { value: "gpt-3.5-turbo", label: "GPT 3.5 Turbo" },
              { value: "gpt-5-nano", label: "GPT 5 Nano" },
            ];

            ExtensionConfigHelper.upsertConfig(extensionList, "GPT_MODEL", {
              type: "enum",
              data: "gpt-4o-mini",
              description: "SPECIFIC GPT MODEL",
              options: JSON.stringify(fallbackModels),
              trigger: null,
              extra: null,
            });
          }
        },
      },
    ],
  },
  PAYMENT_SETTINGS: {
    configs: [
      {
        condition: (extensionList) => true, // eslint-disable-line
        handler: async (extensionList) => {
          const { getCurrenciesByField } = require("../repositories/utils");

          try {
            const currencies = await getCurrenciesByField({ is_active: true });

            const currencyOptions = currencies.map((currency) => ({
              label: `${currency.name} (${currency.code})`,
              value: currency.code,
            }));

            for (let i = 0; i < extensionList.config_keys.length; i++) {
              if (extensionList.config_keys[i] === "PAYMENTS_SETTINGS_DEFAULT_CURRENCY") {
                extensionList.config_data_options[i] =
                  JSON.stringify(currencyOptions);
              }
            }
          } catch (error) {
            logger.error("Error fetching currencies:", error);
          }
        },
      },
    ],
  }
};

/**
 * Applies configuration injection logic to a specific extension.
 *
 * @param {Object} extensionList - The extension object to process and mutate.
 * @param {string} extensionKey - The extension identifier (e.g. "BRAIN").
 * @param {Object} [dataOptions={}] - Optional additional data (e.g. botID).
 * @returns {Promise<void>}
 */
const applyConfigInjections = async (
  extensionList,
  extensionKey,
  dataOptions = {}
) => {
  const injectionConfig = EXTENSION_CONFIG_INJECTIONS[extensionKey];

  if (!injectionConfig) return;

  if (!Array.isArray(extensionList.config_data_trigger)) {
    extensionList.config_data_trigger = Array(
      extensionList.config_keys.length
    ).fill(null);
  }
  if (!Array.isArray(extensionList.config_data_extra)) {
    extensionList.config_data_extra = Array(
      extensionList.config_keys.length
    ).fill(null);
  }

  for (const configInjection of injectionConfig.configs) {
    if (configInjection.condition(extensionList)) {
      await configInjection.handler(extensionList, dataOptions);
    }
  }
};

/**
 * Processes an array of assigned extensions and applies corresponding configuration injections.
 *
 * @param {Array<Object>} assignedExtensions - List of extension objects to process.
 * @param {Object} [dataOptions={}] - Optional additional parameters passed to config handlers.
 * @returns {Promise<void>}
 */
const processExtensionInjections = async (
  assignedExtensions,
  dataOptions = {}
) => {
  for (const extension of assignedExtensions) {
    if (
      extension.extension_key &&
      EXTENSION_CONFIG_INJECTIONS[extension.extension_key]
    ) {
      await applyConfigInjections(
        extension,
        extension.extension_key,
        dataOptions
      );
    }
  }
};

module.exports = {
  applyConfigInjections,
  processExtensionInjections,
  EXTENSION_CONFIG_INJECTIONS,
};
