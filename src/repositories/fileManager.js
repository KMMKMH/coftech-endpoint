const db = require("../utils/db");
const logger = require("../utils/logger");

const getFilesByField = async (data, isRaw = false) => {
  try {
    const query = db("filemanager_files")
      .select(
        "filemanager_files.*",
        db.raw(`CONCAT(filemanager_files.name, filemanager_files.extension) as file_name`),
        "pinecone_index_files.index_id as bot_id"
      )
      .leftJoin(
        "pinecone_index_files",
        "filemanager_files.identificator",
        "pinecone_index_files.file_id"
      )
      .whereNotExists(function () {
        this.select("*")
          .from("pinecone_disabled_files")
          .whereRaw(
            "pinecone_disabled_files.file_id = filemanager_files.uuid_unique"
          );
      })

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting files with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting files`);
  }
};

const getRawFilesByField = async (
  data,
  isRaw = false,
  whereInField = null,
  whereInValues = []
) => {
  try {
    const query = db("filemanager_files");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    if (whereInField && whereInValues && whereInValues.length > 0) {
      query.whereIn(whereInField, whereInValues);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting files with data: ${JSON.stringify(
        data
      )} ${isRaw}, whereIn: ${whereInField}=${JSON.stringify(
        whereInValues
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting files`);
  }
};

const saveFile = async (data) => {
  try {
    const [id] = await db("filemanager_files").insert(data);
    logger.info(`Saving file with data: ${JSON.stringify(data)}`);
    return await getFilesByField({ "filemanager_files.id": id });
  } catch (error) {
    logger.error(`Error saving file with data: ${JSON.stringify(data)},
         error: ${JSON.stringify(error)}`);
    throw new Error(`Error saving file`);
  }
};

const updateFile = async (where, data) => {
  try {
    logger.info(
      `updateFile where: ${JSON.stringify(where)} with data: ${JSON.stringify(
        data
      )}`
    );

    return await db("filemanager_files").where(where).update(data);
  } catch (e) {
    logger.error(
      `Error updating file with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(
      `Error updating file with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
  }
};

const deleteFile = async (data) => {
  try {
    logger.info(`deleting file where: ${JSON.stringify(data)}`);
    return await db("filemanager_files").where(data).del();
  } catch (e) {
    logger.error(
      `Error deleting file with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(
      `Error deleting file with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
  }
};

const getFilesTypeByField = async (data, isRaw = false) => {
  try {
    const query = db("filemanager_types");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting files types with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${error}`
    );
    throw new Error(`Error getting files types data`);
  }
};

const saveFolder = async (data) => {
  try {
    logger.info(`Saving folder with data: ${JSON.stringify(data)}`);
    const [folderID] = await db("filemanager_folders").insert(data);
    const response = folderID
      ? await getFolderByField({ [`filemanager_folders.id`]: folderID })
      : false;
    return response;
  } catch (error) {
    logger.error(
      `Error saving Folder with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(error.message || error);
  }
};

const getFolderByField = async (data, isRaw = false) => {
  try {
    const query = db("filemanager_folders");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => (result.length > 0 ? result : []))
      .catch(() => []);
  } catch (error) {
    logger.error(
      `Error getting Folder from filemanager_folders with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(
      `Error getting Folder from filemanager_folders with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
  }
};

const getUniqueFolderName = async (folderName, parentFolderID, companyID) => {
  const existingFolders = await db("filemanager_folders")
    .where("parent_folder", parentFolderID || null)
    .andWhere("company_id", companyID)
    .andWhere((qb) => {
      qb.where("name", "like", `${folderName} %`).orWhere("name", folderName);
    })
    .select("name");

  const existingNames = new Set(existingFolders.map((folder) => folder.name));

  let counter = 1;
  let newFolderName = folderName;

  while (existingNames.has(newFolderName)) {
    newFolderName = `${folderName} ${counter}`;
    counter++;
  }

  return newFolderName;
};

const deleteFolder = async (whereDelete) => {
  try {
    logger.info(`Deleting Folder where: ${JSON.stringify(whereDelete)}`);
    return await db("filemanager_folders").where(whereDelete).del();
  } catch (error) {
    logger.error(
      `Error deleting Folder with ID: ${whereDelete}, error: ${error.message}`
    );
    throw new Error(
      `Error deleting Folder with ID: ${whereDelete}, error: ${error.message}`
    );
  }
};

const updateFolder = async (where, dataToUpdate) => {
  try {
    logger.info(
      `Updating Folder where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(dataToUpdate)}`
    );
    return await db("filemanager_folders").where(where).update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating Folder with data: ${JSON.stringify(
        dataToUpdate
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(
      `Error updating Folder with data: ${JSON.stringify(
        dataToUpdate
      )}, error: ${JSON.stringify(error)}`
    );
  }
};

const getExtensionImagesByField = async (data, isRaw = false) => {
  try {
    const query = db("extensions_images");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => (result.length > 0 ? result : []))
      .catch(() => []);
  }
  catch (error) {
    logger.error(
      `Error getting extension image with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${error}`
    );
    throw new Error(`Error getting extension image data`);
  }
}

const saveExtensionImage = async (data) => {
  try {
    logger.info(`Saving extension image with data: ${JSON.stringify(data)}`);
    const [id] = await db("extensions_images").insert(data);
    return (await getExtensionImagesByField({ "extensions_images.id": id }))[0];
  } catch (error) {
    logger.error(
      `Error saving extension image with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error saving extension image`);
  }
};

const updateExtensionImage = async (where, data) => {
  try {
    logger.info(
      `Updating extension image where: ${JSON.stringify(where)} with data: ${JSON.stringify(
        data
      )}`
    );
    return await db("extensions_images").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating extension image with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating extension image`);
  }
};

const deleteExtensionImage = async (where) => {
  try {
    logger.info(`Deleting extension image where: ${JSON.stringify(where)}`);
    return await db("extensions_images").where(where).del();
  } catch (error) {
    logger.error(
      `Error deleting extension image with data: ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error deleting extension image`);
  }
};

const saveRagFileUploadStatus = async (data) => {
  try {
    const [id] = await db("filemanager_rag_status").insert(data);
    logger.info(`Saving file with data: ${JSON.stringify(data)}`);
    return await getRagFileUploadStatusByField({
      "filemanager_rag_status.id": id,
    });
  } catch (error) {
    logger.error(`Error saving file with data: ${JSON.stringify(data)},
         error: ${JSON.stringify(error)}`);
    throw new Error(`Error saving file`);
  }
};

const getRagFileUploadStatusByField = async (data, isRaw = false) => {
  try {
    const query = db("filemanager_rag_status");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => (result.length > 0 ? result : []))
      .catch(() => []);
  } catch (error) {
    logger.error(`Error getting file with data: ${JSON.stringify(data)},
         error: ${JSON.stringify(error)}`);
    throw new Error(`Error getting file`);
  }
};

const updateRagFileUploadStatus = async ({ file_id, is_completed }) => {
  try {
    return await db("filemanager_rag_status")
      .where({
        "filemanager_rag_status.file_id": file_id,
      })
      .update({ is_completed });
  } catch (error) {
    logger.error(`Error updating file with identifier: ${file_id},
         error: ${JSON.stringify(error)}`);
    throw new Error(`Error updating file`);
  }
};

const deleteRagFileUploadStatus = async (where) => {
  try {
    return await db("filemanager_rag_status").where(where).del();
  } catch (error) {
    logger.error(`Error deleting file with data: ${JSON.stringify(where)},
         error: ${JSON.stringify(error)}`);
    throw new Error(`Error deleting file`);
  }
};

module.exports = {
  getFilesByField,
  getRawFilesByField,
  getFilesTypeByField,
  saveFile,
  updateFile,
  deleteFile,
  saveFolder,
  deleteFolder,
  updateFolder,
  getFolderByField,
  getUniqueFolderName,
  getExtensionImagesByField,
  saveExtensionImage,
  updateExtensionImage,
  deleteExtensionImage,
  saveRagFileUploadStatus,
  getRagFileUploadStatusByField,
  updateRagFileUploadStatus,
  deleteRagFileUploadStatus,
};
