const Joi = require("joi");

const repoRoles = require("../repositories/roles");
const modelRoles = require("../models/roles");
const repoCompany = require("../repositories/company");
const repoAccounts = require("../repositories/accounts");

const getRolesList = async (req, res) => {
  try {
    const { roleID } = req.query;

    const paramsSchema = Joi.object({
      roleID: Joi.string().allow("", null),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { user } = req.unique_token;

    if (!user) {
      throw new Error(`user don't found`);
    }

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { role_key } = accountField;

    if (roleID) {
      const [roleField] = await repoRoles.getRoleByField({
        "roles.uuid_unique": roleID,
      });

      if (!roleField) {
        throw new Error(`Roles: ${roleID} not found.`);
      }
    }

    const findParams = {
      ...(roleID && { "roles.uuid_unique": roleID }),
    };

    let response = await repoRoles.getRoleByField(findParams);

    if (role_key !== "SUPERADMIN") {
      response = response.filter((role) => role.key !== "SUPERADMIN");
      response = response.filter((role) => role.key !== "STAFF");
      response = response.filter((role) => role.key !== "RESELLER");
    }

    return res.status(200).json({
      code: 200,
      status: true,
      data: response.length > 0 ? response : [],
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const createRoles = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      name: Joi.string().required(),
      companyID: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { name, companyID } = req.body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with ${companyID} dont found.`);
    }

    const [rolesField] = await repoRoles.getRoleByField({
      "roles.company_id": companyID,
      "roles.name": name,
    });

    if (rolesField) {
      throw new Error(`Role with name ${name} already exists.`);
    }

    const response = await modelRoles.saveRoles(req.body);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const updateRoles = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      roleID: Joi.string().required(),
      companyID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { companyID, roleID } = req.query;
    const { name } = req.body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with ${companyID} dont found.`);
    }

    const [rolesField] = await repoRoles.getRoleByField({
      "roles.company_id": companyID,
      "roles.uuid_unique": roleID,
    });

    if (!rolesField) {
      throw new Error(`Role with name ${roleID} not found.`);
    }

    const [nameRoleField] = await repoRoles.getRoleByField({
      "roles.company_id": companyID,
      "roles.name": name,
    });

    if (nameRoleField) {
      throw new Error(`Role with name ${name} already exists.`);
    }

    const response = await modelRoles.updateRoles(req.query, req.body);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const deleteRoles = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      roleID: Joi.string().required(),
      companyID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { companyID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with ${companyID} dont found.`);
    }

    const response = await modelRoles.deleteRoles(req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const addPermissionsRole = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      roleID: Joi.string().required(),
      companyID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      permissions: Joi.array().items(Joi.string().required()).min(1).required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { companyID, roleID } = req.query;
    const { permissions } = req.body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with ${companyID} dont found.`);
    }

    const [rolesField] = await repoRoles.getRoleByField({
      "roles.company_id": companyID,
      "roles.uuid_unique": roleID,
    });

    if (!rolesField) {
      throw new Error(`Role with id ${roleID} not found.`);
    }

    const response = await modelRoles.addRolePermissions(
      req.query,
      permissions
    );

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const deletePermissionsRole = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      roleID: Joi.string().required(),
      companyID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      permissions: Joi.array()
        .items(
          Joi.string()
            .pattern(/^([a-zA-Z0-9_-]+(:[a-zA-Z0-9_-]+)*):([a-zA-Z0-9_-]+)$/)
            .required()
        )
        .min(1)
        .required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { companyID, roleID } = req.query;
    const { permissions } = req.body;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with ${companyID} not found.`);
    }

    const [rolesField] = await repoRoles.getRoleByField({
      "roles.company_id": companyID,
      "roles.uuid_unique": roleID,
    });

    if (!rolesField) {
      throw new Error(`Role with name ${roleID} not found.`);
    }

    const response = await modelRoles.deletePermissionsRole(
      roleID,
      permissions
    );

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getRolePermissions = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      roleID: Joi.string().required(),
      companyID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { roleID, companyID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with ${companyID} not found.`);
    }

    const [roleField] = await repoRoles.getRoleByField({
      "roles.uuid_unique": roleID,
      "roles.company_id": companyID,
    });

    if (!roleField) {
      throw new Error(`Roles: ${roleID} not found.`);
    }

    const where = {
      "role_permissions.role_id": roleID,
    };

    const response = await repoRoles.getPermissionsRole(where);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response.length > 0 ? response : [],
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

module.exports = {
  createRoles,
  updateRoles,
  getRolesList,
  deleteRoles,
  addPermissionsRole,
  deletePermissionsRole,
  getRolePermissions,
};
