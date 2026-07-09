const modelsBots = require("./bots");
const modelStorage = require("./storage");

const repoCompany = require("../repositories/company");
const repoAccounts = require("../repositories/accounts");
const repoAWS = require("../repositories/aws");
const repoBots = require("../repositories/bots");
const repoExtension = require("../repositories/extensions");
const { apiKeyValidatorHandler } = require("../utils/apiKeyValidator");

const { sendDataToInstance } = require("../utils/sendDataToInstance");
const { isParsable } = require("../utils/isParsable");
const { BOT_EVENTS } = require("../utils/events");
const createBotQueue = require("../utils/rabbit/createBotQueue");

const getCompanyList = async (data) => {
  try {
    const { user, companyID } = data;

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    if (!accountField) {
      throw new Error("Account not found.");
    }

    const { role_key, company_id } = accountField;

    if (!companyID && role_key !== "SUPERADMIN") {
      throw new Error("Company access denied.");
    } else {
      if (role_key !== "SUPERADMIN" && companyID !== company_id) {
        throw new Error(`Company ${companyID} access denied.`);
      }
    }

    return await repoCompany.getCompanyByField({
      ...(companyID && { "company.uuid_unique": companyID }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const updateCompany = async (companyID, data, extras = {}) => {
  try {
    const [dataCompany] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    let fieldsToUpdate = ["name", "logo"];

    const { user } = extras.userToken;
    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { role_key, company_id } = accountField;
    if (role_key !== "SUPERADMIN") {
      if (company_id != companyID) {
        throw new Error(`Incorrect company ID ${companyID}.`);
      }

      delete data["status"];
    } else {
      fieldsToUpdate.push("status");
    }

    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (data[field] != undefined && data[field] != dataCompany[field]) {
        dataUpdate[field] = data[field];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      return await repoCompany.updateCompany(
        { "company.uuid_unique": companyID },
        dataUpdate
      );
    } else {
      return true;
    }
  } catch (e) {
    throw new Error(e);
  }
};

const updateCompanyConfigs = async (query, body) => {
  try {
    const { companyID, botID } = query;
    const { key, updated_by } = body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    let dataCompanyConfig = null;
    let ownerType = null;
    let ownerID = null;

    for (const [type, config] of Object.entries(ownerConfigs)) {
      const paramValue = query[config.paramKey];
      if (paramValue && botID) {
        ownerType = type;
        ownerID = paramValue;

        const ownerField = await config.validateOwner(ownerID);
        await config.validateRelation(ownerID, botID, ownerField);
        break;
      }
    }

    if (botID) {
      const [botField] = await repoBots.getBotsByField({
        "bots.uuid_unique": botID,
        "bots.company_id": companyID,
      });
      if (!botField) {
        throw new Error(`Bot: ${botID} not found for company ${companyID}.`);
      }
    }

    if (ownerType && ownerID) {
      const searchCriteria = {
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": ownerType,
        "configs_templates.key": key,
      };

      const ownerConfig = ownerConfigs[ownerType];
      if (ownerConfig && ownerConfig.template_field) {
        searchCriteria[`configs_templates.${ownerConfig.template_field}`] =
          ownerID;
      }

      [dataCompanyConfig] = await repoCompany.getCompanyConfigByField(
        searchCriteria
      );
    } else {
      [dataCompanyConfig] = await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "configs_templates.key": key,
      });
    }

    if (!dataCompanyConfig) {
      throw new Error(`Company Config with key ${key} not found.`);
    }

    const [configTemplateField] = await repoCompany.getConfigsTemplatesByField({
      "configs_templates.key": key,
    });
    if (!configTemplateField) {
      throw new Error(`Config template with key ${key} not found.`);
    }
    if (configTemplateField.internal == true) {
      throw new Error(
        `Config template with key ${key} is internal and can't be updated.`
      );
    }

    const { data_default, data_type } = configTemplateField;

    const parsedDefaultData = isParsable(data_default)
      ? JSON.parse(data_default)
      : null;

    let parsedData = isParsable(body.data) ? JSON.parse(body.data) : null;

    const objectDataTypes = ["json", "json_array"];
    if (
      parsedDefaultData &&
      parsedData &&
      objectDataTypes.includes(data_type)
    ) {
      if (!parsedData.length) {
        throw new Error(`Data key ${key} not allowed to be empty.`);
      }

      const validateKeys = (defaultKeys, dataKeys) => {
        if (defaultKeys.length !== dataKeys.length) {
          throw new Error(
            `Data keys length mismatch: expected ${defaultKeys.length}, but got ${dataKeys.length}.`
          );
        }

        for (const key of defaultKeys) {
          if (!dataKeys.includes(key)) {
            throw new Error(`Data key ${key} not found.`);
          }
        }
      };

      const validatePromptLength = (defaultItem, dataItem) => {
        const restrictionMax = defaultItem?.restrictions?.prompt?.maxLength;
        if (restrictionMax && dataItem?.prompt?.length > restrictionMax) {
          throw new Error(
            `Prompt length exceeds maxLength of ${restrictionMax} characters.`
          );
        }
      };

      if (Array.isArray(parsedDefaultData) && Array.isArray(parsedData)) {
        const defaultDataKeys = parsedDefaultData.flatMap((item) =>
          Object.keys(item)
        );

        for (let i = 0; i < parsedData.length; i++) {
          const dataKeys = Object.keys(parsedData[i]);
          validateKeys(defaultDataKeys, dataKeys);
          validatePromptLength(parsedDefaultData[i], parsedData[i]);
        }
      } else {
        const defaultDataKeys = Object.keys(parsedDefaultData);
        const dataKeys = Object.keys(parsedData);
        validateKeys(defaultDataKeys, dataKeys);
        validatePromptLength(parsedDefaultData, parsedData);
      }
    }

    const fieldsToUpdate = ["data"];
    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (body[field] != undefined && body[field] != dataCompanyConfig[field]) {
        dataUpdate[field] = body[field];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      if (
        !dataUpdate["data"] &&
        !(data_type === "string" && dataUpdate["data"] === "")
      ) {
        return;
      }

      if (botID && ownerType) {
        const [instanceBotField] = await repoAWS.getInstanceBotsByField({
          "aws_instances_bots.bot_id": botID,
        });
        if (instanceBotField) {
          const configData = {
            template_key: key,
            data: body.data,
            owner_type: ownerType,
            owner_id: ownerID,
          };
          const extraConfigs = [];

          if (ownerType === "extension") {
            configData.extension_category_name =
              dataCompanyConfig.extension_category_name;
            configData.extension_category_dynamic =
              dataCompanyConfig.extension_category_dynamic;

            const isStatusTemplateKey = key.toLowerCase().endsWith("_status");
            const isLLMCategory = dataCompanyConfig.extension_category_name === "LLM";

            if (
              isStatusTemplateKey &&
              dataCompanyConfig.extension_category_unique &&
              body.data === "true"
            ) {
              const conflictingExtensionsConfigs =
                await repoCompany.getCompanyConfigByField({
                  "company_configs.bot_id": botID,
                  "company_configs.company_id": companyID,
                  "configs_templates.owner_type": "extension",
                  "company_configs.data": "true",
                  "extensions_categories.unique": true,
                  "extensions_categories.uuid_unique":
                    dataCompanyConfig.extension_category_uuid_unique,
                });

              const mappedConflictingExtensionsConfigs =
                conflictingExtensionsConfigs.map((conflict) => {
                  extraConfigs.push({
                    template_key: conflict.template_key,
                    data: "false",
                    owner_type: "extension",
                    owner_id: conflict.template_extension_id,
                    extension_category_name: conflict.extension_category_name,
                    extension_category_dynamic:
                      conflict.extension_category_dynamic,
                  });
                  return conflict.uuid_unique;
                });

              await repoCompany.updateCompanyConfigStatusExtension(
                mappedConflictingExtensionsConfigs,
                {
                  data: "false",
                }
              );
            }

            const isAPIKey = key.endsWith("_KEY");
            if (
              isLLMCategory &&
              isAPIKey &&
              dataCompanyConfig.extension_category_unique &&
              body.data !== ""
            ) {
              const conflictingLLMConfigs =
                await repoCompany.getCompanyConfigByField({
                  "company_configs.bot_id": botID,
                  "company_configs.company_id": companyID,
                  "configs_templates.owner_type": "extension",
                  "extensions_categories.key": "LLM",
                  "extensions_categories.unique": true,
                });

              const mappedConflictingLLMConfigs = conflictingLLMConfigs
                .filter((conflict) => {
                  const isConflictAPIKey = conflict.template_key.endsWith("_KEY");
                  return (
                    isConflictAPIKey &&
                    conflict.template_key !== key &&
                    conflict.data !== ""
                  );
                })
                .map((conflict) => {
                  extraConfigs.push({
                    template_key: conflict.template_key,
                    data: "",
                    owner_type: "extension",
                    owner_id: conflict.template_extension_id,
                    extension_category_name: conflict.extension_category_name,
                    extension_category_dynamic:
                      conflict.extension_category_dynamic,
                  });
                  return conflict.uuid_unique;
                });

              if (mappedConflictingLLMConfigs.length > 0) {
                await repoCompany.updateCompanyConfigStatusExtension(
                  mappedConflictingLLMConfigs,
                  {
                    data: "",
                  }
                );
              }
            }

            const validApiKeys = new Set([
              "OPENAI_KEY",
              "ADMIN_API_KEY",
              "SPEECH_TO_TEXT_OPENAI_KEY",
              "GPT_SPEECH_TO_SPEECH_OPENAI_KEY",
              "GEMINI_API_KEY",
              "BRAIN_OPENROUTER_KEY",
              "PINECONE_API_KEY",
              "ELEVENLABS_KEY",
              "GLORIA_FOOD_AUTH_TOKEN",
            ]);
            
            if (validApiKeys.has(key)) {
              const isValid = await apiKeyValidatorHandler({
                config: key,
                apiKey: body.data,
              });

              if (!isValid) {
                throw new Error(`API Key for ${key} is not valid.`);
              }
            }
          }

          const botQueue = createBotQueue(botID);
          await sendDataToInstance(botQueue, BOT_EVENTS.SAVE_BOT_CONFIG, {
            bot_id: botID,
            configs: [...extraConfigs, configData],
          });
        }
      } else {
        const [companyBotField] = await repoBots.getBotsByField({
          "bots.company_id": companyID,
        });
        if (!companyBotField) return;

        const [instanceBotField] = await repoAWS.getInstanceBotsByField({
          "aws_instances_bots.bot_id": companyBotField.uuid_unique,
        });
        if (instanceBotField) {
          const botQueue = createBotQueue(companyBotField.uuid_unique);
          await sendDataToInstance(
            botQueue,
            BOT_EVENTS.SET_COMPANY_CONFIGS,
            {
              company_configs: [
                {
                  template_key: key,
                  data: body.data,
                },
              ],
            }
          );
        }
      }

      const {
        uuid_unique: companyConfigID,
        config_template_id: configTemplateID,
      } = dataCompanyConfig;

      const where = botID
        ? {
          "company_configs.company_id": companyID,
          "company_configs.bot_id": botID,
          "company_configs.uuid_unique": companyConfigID,
          "company_configs.config_template_id": configTemplateID,
        }
        : {
          "company_configs.company_id": companyID,
          "company_configs.uuid_unique": companyConfigID,
          "company_configs.config_template_id": configTemplateID,
        };

      const accountField = await repoAccounts.getAccountByField({
        "accounts.company_id": companyID,
        "roles.key": "ADMIN",
      });

      const ownerDescription = ownerType
        ? `${ownerType} (${ownerID})`
        : "general";
      const message = `Config updated: ${key} for ${ownerDescription} by ${updated_by}`;

      let botIdToSend = botID;
      if (!botID) {
        const [companyBotField] = await repoBots.getBotsByField({
          "bots.company_id": companyID,
          "bots.status": 1,
          "bots.suspended": 0,
        });

        if (companyBotField && companyBotField.uuid_unique) {
          botIdToSend = companyBotField.uuid_unique;
        }
      }

      for (const account of accountField) {
        try {
          if (account.phone && botIdToSend) {
            await modelsBots.sendMessageBot(
              { botID: botIdToSend },
              { message, phone: account.phone }
            );
          }
          // eslint-disable-next-line no-unused-vars
        } catch (error) {
          continue;
        }
      }

      return await repoCompany.updateCompanyConfig(where, dataUpdate);
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const ownerConfigs = {
  extension: {
    paramKey: "extensionID",
    template_field: "extension_id",
    validateOwner: async (uuid) => {
      const [field] = await repoExtension.getExtensionByField({
        "extensions.uuid_unique": uuid,
      });
      if (!field) throw new Error(`Extension: ${uuid} not found.`);
      return field;
    },
    validateRelation: async (uuid, botID) => {
      const [relation] = await repoBots.getBotsExtensionsByField({
        "vbe.extension_id": uuid,
        "vbe.bot_id": botID,
      });
      if (!relation) {
        throw new Error(`Extension: ${uuid} not found for bot ${botID}.`);
      }
      return relation;
    },
  },
  provider: {
    paramKey: "sn_providerID",
    template_field: "sn_provider_id",
    validateOwner: async (uuid) => {
      const [field] = await repoBots.getProviderByField({
        "social_networks_providers.uuid_unique": uuid,
      });

      if (!field) throw new Error(`Provider: ${uuid} not found.`);
      return field;
    },
    validateRelation: async (uuid, botID, ownerData) => {
      const { social_network_id } = ownerData;

      const [relation] = await repoBots.getBotsByField({
        "social_networks.uuid_unique": social_network_id,
        "bots.uuid_unique": botID,
      });
      if (!relation) {
        throw new Error(`Provider: ${uuid} not found for bot ${botID}.`);
      }
      return relation;
    },
  },
  bot: {
    paramKey: "botID",
    template_field: null,
    validateOwner: async (uuid) => {
      const [field] = await repoBots.getBotsByField({
        "bots.uuid_unique": uuid,
      });
      if (!field) throw new Error(`Bot: ${uuid} not found.`);
      return field;
    },
    validateRelation: async () => {
      return true;
    },
  },
};

const saveCompany = async (data) => {
  try {
    const response = await repoCompany.saveCompany(data);

    const companyConfigs = await repoCompany.getConfigsTemplatesByField({
      "configs_templates.owner_type": "company",
    });

    if (!companyConfigs.length) {
      throw new Error(`Company configs not found.`);
    }

    for (const config of companyConfigs) {
      const { uuid_unique: configID, data_default } = config;
      await repoCompany.saveCompanyConfig({
        "company_configs.company_id": response.uuid_unique,
        "company_configs.config_template_id": configID,
        "company_configs.data": data_default,
      });
    }

    modelStorage.saveStorage(
      { companyID: response.uuid_unique },
      { quota: 1024 * 1024 * 1024 }
    );

    return response;
  } catch (error) {
    throw new Error(error);
  }
};

const getCompanyConfigs = async (data) => {
  try {
    const { bot_id } = data;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": bot_id,
    });
    if (!botField) {
      throw new Error(`Bot: ${bot_id} not found.`);
    }

    const { company_id } = botField;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": company_id,
    });
    if (!companyField) {
      throw new Error(`Company: ${company_id} not found.`);
    }

    const companyConfigs = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": company_id,
      "configs_templates.owner_type": "company",
    });
    if (!companyConfigs || companyConfigs.length === 0) {
      throw new Error(`Company: ${company_id} configs not found.`);
    }

    return companyConfigs;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getCompanyList,
  updateCompany,
  updateCompanyConfigs,
  saveCompany,
  getCompanyConfigs,
};
