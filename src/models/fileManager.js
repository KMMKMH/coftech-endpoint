const { v4 } = require("uuid");
const {
  deleteFileFromS3,
  uploadFileToS3,
  getBucketFiles,
  S3PresignedURL,
  getFileMetadataFromS3,
} = require("../utils/s3Service");

const repoCompany = require("../repositories/company");
const repoAccount = require("../repositories/accounts");
const repoFileManager = require("../repositories/fileManager");
const repoBots = require("../repositories/bots");
const { repoStorage, repoStorageBuckets } = require("../repositories/storage");
const { repoPrompts } = require("../repositories/prompts");
const modelStorage = require("../models/storage");
const modelPinecone = require("../models/pinecone");
const { repoPineconeIndexFiles } = require("../repositories/pinecone");
const repoExtensions = require("../repositories/extensions");
const { verifyGeminiApiKey } = require("../utils/verifyGeminiApiKey");
const { getPineconeClient } = require("../utils/pineconeClient");
const { deleteDocumentChunks } = require("../utils/pineconeOperations");
const { formatFileSize } = require("../utils/filer_size");
const imageProcessingHelper = require("../utils/imageProcessingHelper");
const dayjs = require("dayjs");

const saveFileByField = async (data) => {
  const { path } = data;

  try {
    await repoFileManager.saveFile(data);
    return (
      await repoFileManager.getFilesByField({
        "filemanager_files.path": path,
      })
    )[0];
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateFile = async (where, data) => {
  try {
    const [dataFile] = await repoFileManager.getFilesByField(where);

    const fieldsToUpdate = ["name", "description"];

    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      const newValue = data[field];
      const currentValue = dataFile[field];

      const isDifferent =
        (newValue === null && currentValue !== null) ||
        (newValue !== undefined && newValue !== currentValue);

      if (isDifferent) {
        dataUpdate[field] = newValue;
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      const result = await repoFileManager.updateFile(where, dataUpdate);

      return { success: result > 0, updated: result > 0 };
    }

    return { success: true, updated: false };
  } catch (error) {
    throw new Error(error.message || error);
  }
};

const deleteFile = async (data) => {
  try {
    const { companyID, fileID } = data;

    const [dataFile] = await repoFileManager.getFilesByField({
      "filemanager_files.company_id": companyID,
      "filemanager_files.uuid_unique": fileID,
    });

    if (!dataFile) {
      throw new Error(`File with data ${JSON.stringify(data)} not found`);
    }

    const { bucket, path, size, source, identificator } = dataFile;

    if (source === "rag") {
      const { Metadata: metadata } = await getFileMetadataFromS3(bucket, path);
      const { botid } = metadata;
      const pineconeDelete = { companyID, botID: botid, fileID: identificator };
      const [pineconeField] = await repoPineconeIndexFiles.getByField(
        {
          "pinecone_index_files.file_id": identificator,
          "pinecone_index_files.index_id": botid,
        }
      );

      if (pineconeField) {
        await modelPinecone.deleteDocument(pineconeDelete);
      }
    }

    await deleteFileFromS3(bucket, path);

    if (
      [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
        ".ico",
      ].includes(dataFile.extension)
    ) {
      const companyPrompts = await repoPrompts.getPromptsWithImageUrl(
        companyID,
        dataFile.path
      );

      for (const prompt of companyPrompts) {
        const { data, metadata } = prompt;

        if (
          !imageProcessingHelper.hasImageUrls(data) ||
          !data.includes(`[[${dataFile.path}]]`) ||
          !metadata ||
          !metadata.available_images ||
          metadata.available_images.length == 0
        ) {
          continue;
        }

        const updateData = {
          data: data.replaceAll(`[[${dataFile.path}]]`, ""),
        };

        if (metadata.available_images.length == 1) {
          const [field] = metadata.available_images;
          if (field.uuid_unique === fileID) {
            updateData["metadata"] = null;
          }
        } else {
          updateData["metadata"] = JSON.stringify({
            ...metadata,
            available_images: metadata.available_images.filter(
              ({ uuid_unique }) => uuid_unique !== fileID
            ),
          });
        }

        await repoPrompts.update(
          { "prompts.uuid_unique": prompt.uuid_unique },
          updateData
        );
      }
    }

    const result = await repoFileManager.deleteFile({
      "filemanager_files.company_id": companyID,
      "filemanager_files.uuid_unique": fileID,
    });

    const { available_space: availableSpace } =
      await modelStorage.realeaseSpace(companyID, size);

    return {
      success: result > 0,
      fileSize: result > 0 ? size : 0,
      availableSpace: result > 0 ? availableSpace : 0,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const saveFolder = async (foldersInfo, queryInfo) => {
  try {
    const { companyID } = queryInfo;
    const { folderName, parentFolderID } = foldersInfo;

    const lastFolderName = await repoFileManager.getUniqueFolderName(
      folderName,
      parentFolderID,
      companyID
    );

    const dataToSave = {
      company_id: companyID,
      name: lastFolderName,
      is_root: !parentFolderID,
      parent_folder: parentFolderID || null,
    };

    return await repoFileManager.saveFolder(dataToSave);
  } catch (error) {
    throw new Error(error.message);
  }
};

const uploadFile = async (req, fileName, extension) => {
  const { folderID, source = "filemanager" } = req.query;

  const filePath = `${source}/${
    folderID ? folderID + "/" : ""
  }${fileName}${extension}`;
  const { buffer } = req.file;

  const bucket =
    source === "filemanager"
      ? process.env.AWS_FILEMANAGER_BUCKET
      : source === "desk"
      ? process.env.AWS_DESK_BUCKET // eslint-disable-line
      : process.env.AWS_PUBLIC_BUCKET; // eslint-disable-line

  try {
    await uploadFileToS3(bucket, filePath, buffer, req.file.mimetype);

    return { filePath, bucket };
  } catch (s3Error) {
    throw new Error(`S3 upload failed: ${s3Error.message}`);
  }
};

const getFolderSize = async (folderID) => {
  let totalSize = 0;

  const filesField = await repoFileManager.getFilesByField({
    "filemanager_files.folder": folderID,
  });

  if (filesField && filesField.length > 0) {
    for (const file of filesField) {
      totalSize += file.size;
    }
  }

  const subFolders = await repoFileManager.getFolderByField({
    "filemanager_folders.parent_folder": folderID,
  });

  if (subFolders && subFolders.length > 0) {
    for (const subFolder of subFolders) {
      const subFolderSize = await getFolderSize(subFolder.uuid_unique);
      totalSize += subFolderSize;
    }
  }

  return totalSize;
};

const deleteFolder = async (whereData) => {
  try {
    const { folderID, companyID } = whereData;

    const [folderField] = await repoFileManager.getFolderByField({
      "filemanager_folders.uuid_unique": folderID,
      "filemanager_folders.company_id": companyID,
    });

    if (!folderField) {
      throw new Error(
        `Folder with UUID ${folderID} not found for company ${companyID}.`
      );
    }

    const folderSize = await getFolderSize(folderID);
    const { available_space: availableSpace } =
      await modelStorage.realeaseSpace(companyID, folderSize);

    const result = await repoFileManager.deleteFolder({
      "filemanager_folders.uuid_unique": folderID,
      "filemanager_folders.company_id": companyID,
    });

    return {
      success: result > 0,
      folderSize: result > 0 ? folderSize : 0,
      availableSpace,
    };
  } catch (error) {
    throw new Error(error.message || error);
  }
};

const updateFolder = async (query, data) => {
  try {
    const { folderID, companyID } = query;

    const dontUpdateFields = [
      "id",
      "uuid_unique",
      "company_id",
      "created_at",
      "updated_at",
      "parent_folder",
      "is_root",
      "path",
    ];

    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => !dontUpdateFields.includes(key))
    );

    const where = {
      "filemanager_folders.uuid_unique": folderID,
      "filemanager_folders.company_id": companyID,
    };

    if (Object.keys(filteredData).length > 0) {
      const result = await repoFileManager.updateFolder(where, filteredData);

      return { success: result > 0, updated: result > 0 };
    }

    return { success: true, updated: false };
  } catch (error) {
    throw new Error(error);
  }
};

const moveFile = async (query) => {
  try {
    const { fileID, targetFolderID, companyID } = query;

    const [fileField] = await repoFileManager.getFilesByField({
      "filemanager_files.uuid_unique": fileID,
      "filemanager_files.company_id": companyID,
    });

    if (!fileField) {
      throw new Error(`Source file with ID ${fileID} not found.`);
    }

    if (targetFolderID) {
      const [targetFolderField] = await repoFileManager.getFolderByField({
        "filemanager_folders.uuid_unique": targetFolderID,
        "filemanager_folders.company_id": companyID,
      });

      if (!targetFolderField) {
        throw new Error(`Target folder with UUID ${targetFolderID} not found.`);
      }
    }

    const updateData = {
      folder: targetFolderID || null,
    };

    const updateWhere = {
      "filemanager_files.uuid_unique": fileID,
      "filemanager_files.company_id": companyID,
    };

    return await repoFileManager.updateFile(updateWhere, updateData);
  } catch (error) {
    throw new Error(`Error moving file: ${error.message}`);
  }
};

const moveFolder = async (query) => {
  try {
    const { folderID, targetFolderID, companyID } = query;

    const [folderField] = await repoFileManager.getFolderByField({
      "filemanager_folders.uuid_unique": folderID,
      "filemanager_folders.company_id": companyID,
    });

    if (!folderField) {
      throw new Error(`Source folder with UUID ${folderID} not found.`);
    }

    const isRoot = !targetFolderID;
    const parentFolder = isRoot ? null : targetFolderID;

    if (!isRoot) {
      const [targetFolderField] = await repoFileManager.getFolderByField({
        "filemanager_folders.uuid_unique": targetFolderID,
        "filemanager_folders.company_id": companyID,
      });

      if (!targetFolderField) {
        throw new Error(`Target folder with UUID ${targetFolderID} not found.`);
      }
    }

    const updateData = {
      parent_folder: parentFolder,
      is_root: isRoot,
    };

    const whereUpdate = {
      "filemanager_folders.uuid_unique": folderID,
      "filemanager_folders.company_id": companyID,
    };

    return await repoFileManager.updateFolder(whereUpdate, updateData);
  } catch (error) {
    throw new Error(`Error moving folder: ${error.message}`);
  }
};

const getFilesMetadata = async (query) => {
  const { companyID, fileID } = query;

  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found.`);
    }

    let where = {
      "filemanager_files.company_id": companyID,
    };

    if (fileID) {
      where["filemanager_files.uuid_unique"] = fileID;
    }

    return await repoFileManager.getFilesByField(where);
  } catch (error) {
    throw new Error(error);
  }
};

const uploadFileMetadata = async (query, body) => {
  const { companyID } = query;
  const { filename, identificator, size, source, userID, description } = body;

  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found.`);
    }

    const [userAccountInitial] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": userID,
    });

    if (!userAccountInitial) {
      throw new Error(`User with id ${userID} not found.`);
    }

    const { role_key: userRoleKey, company_id: userCompanyId } =
      userAccountInitial;

    let accountField = userAccountInitial;

    if (userRoleKey !== "SUPERADMIN" && userCompanyId !== companyID) {
      accountField = undefined;
    }

    if (!accountField) {
      throw new Error(
        `User with id ${userID} not found for the specified criteria or company.`
      );
    }

    const [bucketField] = await repoStorageBuckets.getByField({
      "storage_buckets.company_id": companyID,
    });

    if (!bucketField) {
      throw new Error(`Bucket with company ID ${companyID} not found.`);
    }

    const extension = filename.split(".").pop();

    const name = filename.endsWith(`.${extension}`)
      ? filename.split(`.${extension}`)[0]
      : filename;

    const data = {
      company_id: companyID,
      name,
      identificator,
      size,
      source,
      bucket: bucketField.bucket_name,
      path: `https://${bucketField.bucket_name}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${source}/${identificator}.${extension}`,
      extension: `.${extension}`,
      ...(description && { description }),
      upload_by: userID,
    };

    const [metadataField] = await repoFileManager.saveFile(data);
    if (typeof source === "string" && source.toLowerCase() === "rag") {
      await repoFileManager.saveRagFileUploadStatus({
        file_id: metadataField.identificator,
        date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      });
    }

    return metadataField;
  } catch (error) {
    throw new Error(error);
  }
};

const getCompanyBucketFiles = async (query) => {
  const { companyID } = query;

  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found.`);
    }

    const [bucketField] = await repoStorageBuckets.getByField({
      "storage_buckets.company_id": companyID,
    });
    if (!bucketField) {
      throw new Error(`Bucket with company ID ${companyID} not found.`);
    }

    const bucketFiles = await getBucketFiles(bucketField.bucket_name);
    let bucket_size = 0;

    const files = bucketFiles.Contents.map((file) => {
      bucket_size += file.Size;

      return {
        key: file.Key,
        size: file.Size,
        source: file.Key.split("/")[0],
        last_modified: file.LastModified,
      };
    });

    return {
      files,
      files_length: files.length,
      bucket_size,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

const generateGetPresignedURL = async (query) => {
  const { companyID, fileID } = query;

  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found.`);
    }

    const [bucketField] = await repoStorageBuckets.getByField({
      "storage_buckets.company_id": companyID,
    });
    if (!bucketField) {
      throw new Error(`Bucket with company ID ${companyID} not found.`);
    }

    const [fileField] = await repoFileManager.getRawFilesByField({
      "filemanager_files.uuid_unique": fileID,
      "filemanager_files.company_id": companyID,
    });
    if (!fileField) {
      throw new Error(`File with ID ${fileID} not found.`);
    }

    const key = `${fileField.source}/${fileField.identificator}${fileField.extension}`;

    return await S3PresignedURL.get({
      key,
      origin_bucket: bucketField.bucket_name,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const generatePutPresignedURL = async (query, body) => {
  const {
    companyID,
    filePath,
    fileSize,
    source = "filemanager",
    botID,
    user: userID,
  } = query;

  const { description } = body;

  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Company with id ${companyID} not found`);
    }

    const [storageField] = await repoStorage.getByField({
      "storage_company.company_id": companyID,
    });
    if (!storageField) {
      throw new Error(`Bucket with company ID ${companyID} not found.`);
    }

    const { available_space } = storageField;

    if (available_space < fileSize) {
      throw new Error(
        `Insufficient storage space. Available: ${formatFileSize(
          available_space
        )}, Required: ${formatFileSize(fileSize)}`
      );
    }

    const [bucketField] = await repoStorageBuckets.getByField({
      "storage_buckets.company_id": companyID,
    });
    if (!bucketField) {
      throw new Error(`Bucket with company ID ${companyID} not found.`);
    }

    let geminiApiKeyConfig = null;

    if (botID) {
      const [botField] = await repoBots.getBotsByField({
        "bots.uuid_unique": botID,
        "bots.company_id": companyID,
      });

      if (!botField) {
        throw new Error(`Bot with UUID ${botID} not found.`);
      }

      const [config] = await repoCompany.getCompanyConfigByField({
        "company_configs.company_id": companyID,
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "GEMINI_API_KEY",
      });

      if (!config || config.data === "") {
        throw new Error("gemini API Key is not set");
      }

      const verifyKey = await verifyGeminiApiKey(
        config.data,
        "models/embedding-001",
        botID
      );

      if (!verifyKey.success) {
        throw new Error(
          `Gemini API Key is invalid: ${verifyKey.error.message}`
        );
      }

      geminiApiKeyConfig = config;
    }

    const fileKey = filePath.startsWith(`${source}/`)
      ? `${filePath}`
      : `${source.toLowerCase()}/${filePath}`;

    return await S3PresignedURL.put({
      filePath: fileKey,
      source,
      destination_bucket: bucketField.bucket_name,
      botID: botID || null,
      companyID,
      geminiApiKey: geminiApiKeyConfig?.data || null,
      description: description || null,
      userID: userID || null,
      useCompanyBucket: true,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const listExtensionImages = async (query) => {
  const { extensionID } = query;

  try {
    const [extensionField] = await repoExtensions.getExtensionByField({
      "extensions.uuid_unique": extensionID,
    });

    if (!extensionField) {
      throw new Error(`Extension with ID ${extensionID} not found.`);
    }

    return await repoFileManager.getExtensionImagesByField({
      "extensions_images.extension_id": extensionID,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const uploadExtensionImage = async (query, body, file) => {
  const { extensionID } = query;
  const { is_cover, alter_text } = body;
  const { buffer } = file;

  try {
    const [extensionField] = await repoExtensions.getExtensionByField({
      "extensions.uuid_unique": extensionID,
    });

    if (!extensionField) {
      throw new Error(`Extension with ID ${extensionID} not found.`);
    }

    const identificator = v4();
    const bucket = process.env.AWS_S3_MEDIA_BUCKET;
    const filePath = `extension_images/${identificator}.${
      file.mimetype.split("/")[1]
    }`;

    const url = await uploadFileToS3(bucket, filePath, buffer, file.mimetype);
    if (!url) {
      throw new Error("Failed to upload file to S3.");
    }

    if (is_cover) {
      await repoFileManager.updateExtensionImage(
        {
          "extensions_images.extension_id": extensionID,
          "extensions_images.is_cover": true,
        },
        { is_cover: false }
      );
    }

    return await repoFileManager.saveExtensionImage({
      extension_id: extensionID,
      url,
      identificator,
      is_cover,
      alter_text,
    });
  } catch (error) {
    throw new Error(`Error uploading extension image: ${error.message}`);
  }
};

const updateExtensionImage = async (query, body) => {
  const { extensionImageID } = query;

  const fieldsToUpdate = ["is_cover", "alter_text"];

  try {
    const [extensionImageField] =
      await repoFileManager.getExtensionImagesByField({
        "extensions_images.uuid_unique": extensionImageID,
      });
    if (!extensionImageField) {
      throw new Error(`Extension image with ID ${extensionImageID} not found.`);
    }

    let updateData = {};
    fieldsToUpdate.forEach((field) => {
      if (
        body[field] != undefined &&
        body[field] != null &&
        body[field] != extensionImageField[field]
      ) {
        updateData[field] = body[field];
      }
    });

    if (updateData.is_cover) {
      await repoFileManager.updateExtensionImage(
        {
          "extensions_images.extension_id": extensionImageField.extension_id,
          "extensions_images.is_cover": true,
        },
        { is_cover: false }
      );
    }

    if (Object.keys(updateData).length > 0) {
      return await repoFileManager.updateExtensionImage(
        { "extensions_images.uuid_unique": extensionImageID },
        updateData
      );
    }

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteExtensionImage = async (query) => {
  const { extensionImageID } = query;

  try {
    const [extensionImageField] =
      await repoFileManager.getExtensionImagesByField({
        "extensions_images.uuid_unique": extensionImageID,
      });
    if (!extensionImageField) {
      throw new Error(`Extension image with ID ${extensionImageID} not found.`);
    }

    await deleteFileFromS3(
      process.env.AWS_S3_MEDIA_BUCKET,
      extensionImageField.url
    );

    return await repoFileManager.deleteExtensionImage({
      "extensions_images.uuid_unique": extensionImageID,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const clearUncompletedFile = async (file_id) => {
  try {
    const [fileField] = await repoFileManager.getFilesByField({
      "filemanager_files.identificator": file_id,
    });
    if (!fileField) {
      throw new Error(`File with id ${file_id} not found`);
    }

    const [bucketField] = await repoStorageBuckets.getByField({
      "storage_buckets.company_id": fileField.company_id,
    });
    if (!bucketField) {
      throw new Error(`Bucket for file ${file_id} not found`);
    }

    await deleteFileFromS3(bucketField.bucket_name, fileField.path);

    const [pineconeIndexField] =
      await repoPineconeIndexFiles.getIndexFilesByField({
        "pinecone_index_files.file_id": file_id,
      });

    if (pineconeIndexField) {
      const { index_id: botID } = pineconeIndexField;
      const pinecone = await getPineconeClient(botID);
      await deleteDocumentChunks(pinecone, file_id);
    } else {
      console.warn(
        `No Pinecone index found for file ${file_id}. Skipping Pinecone deletion.`
      );
    }

    return await repoFileManager.deleteFile({
      "filemanager_files.identificator": file_id,
    });
  } catch (error) {
    console.error(`Error clearing uncompleted file ${file_id}:`, error.message);
  }
};

module.exports = {
  saveFileByField,
  updateFile,
  deleteFile,
  saveFolder,
  deleteFolder,
  updateFolder,
  moveFile,
  moveFolder,
  uploadFile,
  getFilesMetadata,
  uploadFileMetadata,
  getCompanyBucketFiles,
  generateGetPresignedURL,
  generatePutPresignedURL,
  listExtensionImages,
  uploadExtensionImage,
  updateExtensionImage,
  deleteExtensionImage,
  clearUncompletedFile,
};
