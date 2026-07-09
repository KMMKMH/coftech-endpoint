const Joi = require("joi");
const { v4: uuid } = require("uuid");

const { sendResponse } = require("../utils/sendResponse");

const repoFileManager = require("../repositories/fileManager");
const repoBots = require("../repositories/bots");
const repoCompany = require("../repositories/company");
const repoAccounts = require("../repositories/accounts");
const { repoStorage } = require("../repositories/storage");
const { repoPineconeIndexFiles } = require("../repositories/pinecone");
const { repoDashLogs } = require("../repositories/dashboardLogs");
const modelStorage = require("../models/storage");
const modelFileManager = require("../models/fileManager");
const modelBots = require("../models/bots");
const { formatFileSize } = require("../utils/filer_size");
const { updateVectorMetadata } = require("../models/pinecone");
const { utilActionType, utilResourceType } = require("../utils/utilDashLogs");

const listFileTypes = async (req, res) => {
  try {
    const queryParams = Joi.object({
      ragCompatible: Joi.string().valid("true", "false").optional(),
    });

    const { error: queryError, value } = queryParams.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const findParams = value?.ragCompatible
      ? { "filemanager_types.is_rag_compatible": value.ragCompatible === "true" }
      : {};

    const response = await repoFileManager.getFilesTypeByField(findParams);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};
const getFileList = async (req, res) => {
  try {
    const params = Joi.object({
      companyID: Joi.string().required(),
      fileID: Joi.string().allow(null, ""),
      source: Joi.string()
        .default("filemanager")
        .allow("filemanager", "rag", "desk"),
      botID: Joi.string().uuid({ version: "uuidv4" }).optional(),
      extensions: Joi.alternatives()
        .try(
          Joi.array().items(Joi.string()),
          Joi.string().custom((value) => {
            return value.split(",").map((item) => item.trim());
          })
        )
        .optional(),
    });

    const { value, error } = params.validate(req.query);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const { companyID, fileID, source, botID, extensions } = value;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    if (extensions && extensions.length > 0) {
      const validExtensions = await repoFileManager.getFilesTypeByField({});

      const validExtensionsList = validExtensions
        .map((item) => item.extension || item.name || item.key)
        .filter((ext) => typeof ext === "string")
        .map((ext) => (ext.startsWith(".") ? ext.slice(1) : ext));

      const extensionsValid = extensions
        .filter((ext) => typeof ext === "string")
        .every((ext) => {
          const cleanExt = ext.startsWith(".") ? ext.slice(1) : ext;
          return validExtensionsList.includes(cleanExt);
        });

      if (!extensionsValid) {
        throw new Error(
          `Invalid extensions provided. Valid extensions are: ${validExtensionsList.join(
            ", "
          )}`
        );
      }
    }

    if (fileID) {
      const [fileField] = await repoFileManager.getFilesByField({
        "filemanager_files.company_id": companyID,
        "filemanager_files.uuid_unique": fileID,
        "filemanager_files.source": source,
      });

      if (!fileField) {
        throw new Error(`File with ID ${fileID} not found.`);
      }
    }

    if (botID) {
      const [botField] = await repoBots.getBotsByField({
        "bots.uuid_unique": botID,
        "bots.company_id": companyID,
      });

      if (!botField) {
        throw new Error(`Bot with ID ${botID} not found.`);
      }
    }

    const response = await repoFileManager.getFilesByField((builder) => {
      builder.where({
        "filemanager_files.source": source,
        "filemanager_files.company_id": companyID,
        ...(fileID && { "filemanager_files.uuid_unique": fileID }),
        ...(botID && { "pinecone_index_files.index_id": botID }),
      });

      if (extensions && extensions.length > 0) {
        const extensionsWithDot = extensions
          .filter((ext) => typeof ext === "string")
          .map((ext) => (ext.startsWith(".") ? ext : `.${ext}`));
        builder.whereIn("filemanager_files.extension", extensionsWithDot);
      }
    });

    const formattedData = response.map((file) => ({
      ...file,
      file_size: formatFileSize(file.size),
    }));

    return res.status(200).json({
      code: 200,
      status: true,
      data: formattedData,
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

const updateFile = async (req, res) => {
  try {
    const params = Joi.object({
      companyID: Joi.string().required(),
      fileID: Joi.string().required(),
    });

    const { error } = params.validate(req.query);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required().min(5),
      description: Joi.string()
        .optional()
        .allow(null)
        .empty("")
        .max(40)
        .default(null),
    });

    const { error: bodyError, value: bodyValues } = bodySchema.validate(
      req.body
    );
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { companyID, fileID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    const whereUpdate = {
      "filemanager_files.uuid_unique": fileID,
      "filemanager_files.company_id": companyID,
    };

    const [fileField] = await repoFileManager.getFilesByField(whereUpdate);

    if (!fileField) {
      throw new Error(`File with Identificator ${fileID} not found`);
    }

    const { name, extension, source, identificator } = fileField;
    const { user } = req.unique_token;
    const { description } = bodyValues;

    if (description !== undefined) {
      const [pineconeIndexField] =
        await repoPineconeIndexFiles.getByField({
          "pinecone_index_files.file_id": identificator,
        });

      if (pineconeIndexField) {
        const { index_id } = pineconeIndexField;

        await updateVectorMetadata(
          { companyID, botID: index_id, fileID: identificator },
          { description }
        );
      }
    }

    const response = await modelFileManager.updateFile(whereUpdate, bodyValues);

    const { success } = response;
    const { name: newFilename } = req.body;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Update,
      resource_type: utilResourceType.File,
      name: `${newFilename}${extension}` || null,
      status: "success",
      company_id: companyID,
      metadata: {
        ...fileField,
      },
    });

    const logsInfo = {
      company_id: companyID,
      operation_type: "update",
      resource_type: "file",
      source,
      file_size: null,
      previous_space: null,
      remaining_space: null,
      file_name: name,
      extension,
      account_id: user,
      status: success ? "success" : "failed",
    };

    await modelStorage.saveStorageLogs(logsInfo);

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { first_name, last_name } = accountField;

    const bodyMessage = {
      message: `The user *${first_name} ${last_name}* has *rename* a *file* with the name *${name}${extension}* to *${newFilename}${extension}*`,
    };

    await modelBots.sendMessageToAdmins({ companyID }, bodyMessage);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const params = Joi.object({
      companyID: Joi.string().required(),
      fileID: Joi.string().required(),
    });

    const { error } = params.validate(req.query);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const { companyID, fileID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    const [fileField] = await repoFileManager.getFilesByField({
      "filemanager_files.uuid_unique": fileID,
      "filemanager_files.company_id": companyID,
    });

    if (!fileField) {
      throw new Error(` File with id ${fileID} not found`);
    }

    const { name, extension, source } = fileField;
    const { user } = req.unique_token;

    const { success, availableSpace, fileSize } =
      await modelFileManager.deleteFile(req.query);

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Delete,
      resource_type: utilResourceType.File,
      name: `${name}${extension}` || null,
      status: "success",
      company_id: companyID,
      metadata: {
        ...fileField,
      },
    });

    const logsInfo = {
      company_id: companyID,
      operation_type: "delete",
      resource_type: "file",
      source,
      file_size: fileSize,
      previous_space: availableSpace - fileSize,
      remaining_space: availableSpace,
      file_name: name,
      extension,
      account_id: user,
      status: success ? "success" : "failed",
    };

    await modelStorage.saveStorageLogs(logsInfo);

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { first_name, last_name } = accountField;

    const bodyMessage = {
      message: `The user *${first_name} ${last_name}* has *deleted* a *file* with the name *${name}${extension}*`,
    };

    await modelBots.sendMessageToAdmins({ companyID }, bodyMessage);

    return res.status(200).json({
      code: 200,
      status: true,
      data: success ? 1 : 0,
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

const uploadFiles = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      folderID: Joi.string().allow(null, ""),
      source: Joi.string().default("filemanager"),
    });
    const { value: paramsValues, error: paramsError } = paramsSchema.validate(
      req.query
    );
    if (paramsError) {
      return sendResponse(
        res,
        400,
        false,
        paramsError.details[0].message,
        paramsError
      );
    }

    const { companyID, folderID } = paramsValues;
    const { source = "filemanager" } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    if (!req.file || !req.file.buffer) {
      return sendResponse(res, 400, false, "No files selected!");
    }

    if (folderID) {
      const [folderField] = await repoFileManager.getFolderByField({
        "filemanager_folders.uuid_unique": folderID,
      });

      if (!folderField) {
        throw new Error(`Folder with ID ${folderID} not found.`);
      }
    }

    const { originalname, size } = req.file;
    const fileName = uuid();

    const {
      status: isAvailableSpace,
      available_space,
      previousSpace,
    } = await modelStorage.checkAndUpdateSpace(companyID, size);

    if (!isAvailableSpace) {
      return sendResponse(
        res,
        400,
        false,
        "Insufficient available space for this upload"
      );
    }

    const lastDotIndex = originalname.lastIndexOf(".");
    const name = originalname.substring(0, lastDotIndex);
    const extension = originalname.substring(lastDotIndex + 1).toLowerCase();

    const { filePath, bucket } = await modelFileManager.uploadFile(
      req,
      fileName,
      extension
    );

    const s3Url = `https://${bucket}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${filePath}`;

    const { user } = req.unique_token;
    const result = await modelFileManager.saveFileByField({
      identificator: fileName,
      company_id: companyID,
      name,
      bucket,
      extension,
      path: s3Url,
      source,
      size,
      folder: folderID || null,
    });
    const operation_status = result ? "success" : "failed";

    const logsInfo = {
      company_id: companyID,
      operation_type: "upload",
      resource_type: "file",
      source,
      file_size: size,
      previous_space: previousSpace,
      remaining_space: available_space,
      file_name: name,
      extension: extension,
      account_id: user,
      status: operation_status,
    };

    await modelStorage.saveStorageLogs(logsInfo);

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { first_name, last_name } = accountField;

    const bodyMessage = {
      message: `The user *${first_name} ${last_name}* has *uploaded* a *file* with the name *${name}${extension}*`,
    };

    await modelBots.sendMessageToAdmins({ companyID }, bodyMessage);

    if (operation_status === "failed") {
      await repoStorage.update(
        { "storage_company.company_id": companyID },
        { available_space: previousSpace }
      );
    }

    sendResponse(res, 200, true, "File uploaded correctly!", { url: s3Url });
  } catch (e) {
    sendResponse(res, 500, false, e.message, e);
  }
};

const getFolderList = async (req, res) => {
  try {
    const { companyID, folderID } = req.query;

    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      folderID: Joi.string().allow("", null),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company: ${companyID} not found.`);
    }

    if (folderID) {
      const [folderField] = await repoFileManager.getFolderByField({
        "filemanager_folders.uuid_unique": folderID,
        "filemanager_folders.company_id": companyID,
      });

      if (!folderField) {
        throw new Error(`Folder: ${folderID} not found.`);
      }
    }

    const findParams = {
      ...{ "filemanager_folders.company_id": companyID },
      ...(folderID && { "filemanager_folders.uuid_unique": folderID }),
    };

    const response = await repoFileManager.getFolderByField(findParams);

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

const createFolder = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      folderName: Joi.string().required(),
      parentFolderID: Joi.string().allow(null, ""),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }
    const { companyID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found`);
    }

    const { parentFolderID, folderName } = req.body;

    if (parentFolderID) {
      const [parentFolder] = await repoFileManager.getFolderByField({
        "filemanager_folders.uuid_unique": parentFolderID,
      });

      if (!parentFolder) {
        throw new Error(`Parent folder with id ${parentFolderID} not found`);
      }

      if (!parentFolder.is_root) {
        throw new Error(
          `Parent folder with id ${parentFolderID} cannot have more than one sublevel`
        );
      }
    }

    const { user } = req.unique_token;
    const [response] = await modelFileManager.saveFolder(req.body, req.query);

    const logsInfo = {
      company_id: companyID,
      operation_type: "create",
      resource_type: "folder",
      source: "filemanager",
      file_size: null,
      previous_space: null,
      remaining_space: null,
      file_name: folderName,
      account_id: user,
      status: response ? "success" : "failed",
    };

    await modelStorage.saveStorageLogs(logsInfo);

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { first_name, last_name } = accountField;

    const bodyMessage = {
      message: `The user *${first_name} ${last_name}* has *create* a *folder* with the name *${folderName}*`,
    };

    await modelBots.sendMessageToAdmins({ companyID }, bodyMessage);

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

const updateFolder = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      folderID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { folderID, companyID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found`);
    }

    const [folderField] = await repoFileManager.getFolderByField({
      "filemanager_folders.uuid_unique": folderID,
      "filemanager_folders.company_id": companyID,
    });

    if (!folderField) {
      throw new Error(`Folder with id ${folderID} not found`);
    }

    const bodySchema = Joi.object({
      name: Joi.string().allow("", null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { name } = folderField;
    const { user } = req.unique_token;
    const response = await modelFileManager.updateFolder(req.query, req.body);
    const { success } = response;

    const logsInfo = {
      company_id: companyID,
      operation_type: "update",
      resource_type: "folder",
      source: "filemanager",
      file_size: null,
      previous_space: null,
      remaining_space: null,
      file_name: name,
      account_id: user,
      status: success ? "success" : "failed",
    };

    await modelStorage.saveStorageLogs(logsInfo);

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { first_name, last_name } = accountField;

    const bodyMessage = {
      message: `The user *${first_name} ${last_name}* has *update* a *folder* with the name *${name}*`,
    };

    await modelBots.sendMessageToAdmins({ companyID }, bodyMessage);

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

const deleteFolder = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      folderID: Joi.string().required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { folderID, companyID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found`);
    }

    const [folderField] = await repoFileManager.getFolderByField({
      "filemanager_folders.uuid_unique": folderID,
      "filemanager_folders.company_id": companyID,
    });

    if (!folderField) {
      throw new Error(`Folder does not exist`);
    }

    const { user } = req.unique_token;
    const { name } = folderField;
    const { success, folderSize, availableSpace } =
      await modelFileManager.deleteFolder(req.query);

    const logsInfo = {
      company_id: companyID,
      operation_type: "delete",
      resource_type: "folder",
      source: "filemanager",
      file_size: folderSize,
      previous_space: availableSpace - folderSize,
      remaining_space: availableSpace,
      file_name: name,
      account_id: user,
      status: success ? "success" : "failed",
    };

    await modelStorage.saveStorageLogs(logsInfo);

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    const { first_name, last_name } = accountField;

    const bodyMessage = {
      message: `The user *${first_name} ${last_name}* has *delete* a *folder* with the name *${name}*`,
    };

    await modelBots.sendMessageToAdmins({ companyID }, bodyMessage);

    return res.status(200).json({
      code: 200,
      status: true,
      data: success ? 1 : 0,
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

const moveFile = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      fileID: Joi.string().required(),
      targetFolderID: Joi.string().allow(null, ""),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { fileID, targetFolderID, companyID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found`);
    }

    const [fileField] = await repoFileManager.getFilesByField({
      "filemanager_files.uuid_unique": fileID,
      "filemanager_files.company_id": companyID,
    });

    if (!fileField) {
      throw new Error(`File with id ${fileID} not exist`);
    }

    if (targetFolderID) {
      const [targetFolderField] = await repoFileManager.getFolderByField({
        "filemanager_folders.uuid_unique": targetFolderID,
        "filemanager_folders.company_id": companyID,
      });

      if (!targetFolderField) {
        throw new Error(`Target folder with ${targetFolderID} does not exist`);
      }
    }

    const response = await modelFileManager.moveFile(req.query);

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

const moveFolder = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      folderID: Joi.string().required(),
      targetFolderID: Joi.string().allow(null, ""),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { folderID, targetFolderID, companyID } = req.query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found`);
    }

    const [folderField] = await repoFileManager.getFolderByField({
      "filemanager_folders.uuid_unique": folderID,
      "filemanager_folders.company_id": companyID,
    });

    if (!folderField) {
      throw new Error(`Folder does not exist`);
    }

    if (targetFolderID) {
      const [targetFolderField] = await repoFileManager.getFolderByField({
        "filemanager_folders.uuid_unique": targetFolderID,
        "filemanager_folders.company_id": companyID,
      });

      if (!targetFolderField) {
        throw new Error(`Target folder with ${targetFolderID} does not exist`);
      }
    }

    const response = await modelFileManager.moveFolder(req.query);

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

const getFilesFromS3 = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelFileManager.getCompanyBucketFiles(req.query);

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

const getFilesMetadata = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      fileID: Joi.string().uuid({ version: "uuidv4" }).optional(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelFileManager.getFilesMetadata(req.query);

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

const uploadFileMetadata = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError, value: queryValues } = paramsSchema.validate(
      req.query
    );
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      filename: Joi.string().required(),
      identificator: Joi.string().uuid({ version: "uuidv4" }).required(),
      size: Joi.number().required(),
      source: Joi.string().required(),
      userID: Joi.string().required(),
      description: Joi.string().optional(),
    });

    const { error: bodyError, value: bodyValues } = bodySchema.validate(
      req.body
    );
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelFileManager.uploadFileMetadata(
      req.query,
      req.body
    );

    const { companyID } = queryValues;
    const { filename } = bodyValues;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Upload,
      resource_type: utilResourceType.File,
      name: filename || null,
      status: "success",
      company_id: companyID,
      metadata: {
        ...bodyValues,
      },
    });

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

const createGetPresignedURL = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      fileID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelFileManager.generateGetPresignedURL(req.query);

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

const createPutPresignedURL = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      filePath: Joi.string().required(),
      fileSize: Joi.number()
        .min(1)
        .max(50 * 1024 * 1024)
        .messages({
          "number.min": "File size must be at least 1 byte.",
          "number.max":
            "File size must not exceed 50 MB. Please choose a smaller file.",
        })
        .required(),
      source: Joi.string().optional(),
      botID: Joi.string().allow(null),
    }).when(
      Joi.object({
        source: Joi.string().valid("rag").required(),
      }).unknown(),
      {
        then: Joi.object({
          botID: Joi.string().uuid({ version: "uuidv4" }).required(),
        }),
      }
    );

    const { error: paramsError, value: paramsValues } = paramsSchema.validate(
      req.query
    );

    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      description: Joi.string().optional(),
    });

    const { error: bodyError, value: bodyValues } = bodySchema.validate(
      req.body
    );

    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { user } = req.unique_token;

    const response = await modelFileManager.generatePutPresignedURL(
      { ...paramsValues, user },
      bodyValues
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

const getExtensionImages = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      extensionID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelFileManager.listExtensionImages(req.query);

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

const uploadExtensionImage = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      extensionID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      is_cover: Joi.boolean().required(),
      alter_text: Joi.string().required(),
    });

    const { error: bodyError, value: bodyValues } = bodySchema.validate(
      req.body
    );
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    if (!req.file || !req.file.buffer) {
      throw new Error("No file selected");
    }

    const validMimeTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!req.file.mimetype || !validMimeTypes.includes(req.file.mimetype)) {
      throw new Error(
        "File type not allowed. Only JPEG, PNG and GIF are accepted."
      );
    }

    const response = await modelFileManager.uploadExtensionImage(
      req.query,
      bodyValues,
      req.file
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

const updateExtensionImage = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      extensionImageID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      is_cover: Joi.boolean().optional(),
      alter_text: Joi.string().optional(),
    });

    const { error: bodyError, value: bodyValues } = bodySchema.validate(
      req.body
    );
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelFileManager.updateExtensionImage(
      req.query,
      bodyValues
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

const deleteExtensionImage = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      extensionImageID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelFileManager.deleteExtensionImage(req.query);

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

module.exports = {
  listFileTypes,
  uploadFiles,
  getFileList,
  updateFile,
  deleteFile,
  getFolderList,
  createFolder,
  updateFolder,
  deleteFolder,
  moveFile,
  moveFolder,
  getFilesMetadata,
  uploadFileMetadata,
  getFilesFromS3,
  createGetPresignedURL,
  createPutPresignedURL,
  getExtensionImages,
  uploadExtensionImage,
  updateExtensionImage,
  deleteExtensionImage,
};
