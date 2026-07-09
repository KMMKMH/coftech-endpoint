const queriesMetadata = require("../../utils/loadQueriesMetadata");
const checkPermissionGQ = require("../../utils/routerPermissionsGQ");
const repoCompany = require("../../repositories/company");
const repoAccounts = require("../../repositories/accounts");
const repoExtensions = require("../../repositories/extensions");

const getOperationsMetadata = async (_, __, context, info) => {
  try {
    const { user } = context;

    await checkPermissionGQ(user, ["ADMIN", "SUPERADMIN"], info.fieldName);

    let metadata = queriesMetadata;

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    if (!accountField) {
      throw new Error("Account not found for user");
    }

    const { company_id, role_key } = accountField;

    if (role_key === "SUPERADMIN") {
      return metadata;
    }

    if (!company_id) {
      throw new Error(`Account with ${user} does not have a company`);
    }

    const extensionDetailsResults = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": company_id,
      "configs_templates.owner_type": "extension",
    });

    const extensions_id = extensionDetailsResults.map(
      (ext) => ext.template_extension_id
    );

    const unique_extensions = [...new Set(extensions_id)];

    const extensionsDetails = await repoExtensions.getExtensionByField({
      "extensions.uuid_unique": unique_extensions,
    });

    const extensionsKeys = extensionsDetails.map((extension) => extension.key);

    metadata = metadata.filter((operation) => {
      if (operation.extension && operation.extension.length > 0) {
        return operation.extension.some((ext) => extensionsKeys.includes(ext));
      }

      return true;
    });

    return metadata.length ? metadata : [];
  } catch (error) {
    console.error("Error in getOperationsMetadata:", error);
    throw new Error("Error retrieving operation metadata", error);
  }
};

module.exports = { getOperationsMetadata };
