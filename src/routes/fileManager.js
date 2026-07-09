const express = require("express");
const router = express.Router();

const {
  listFileTypes,
  uploadFiles,
  getFileList,
  updateFile,
  deleteFile,
  getFolderList,
  createFolder,
  updateFolder,
  deleteFolder,
  moveFolder,
  moveFile,
  getFilesFromS3,
  getFilesMetadata,
  uploadFileMetadata,
  createGetPresignedURL,
  createPutPresignedURL,
  getExtensionImages,
  uploadExtensionImage,
  updateExtensionImage,
  deleteExtensionImage,
} = require("../controllers/fileManager");

const upload = require("../utils/uploadMiddleware");
const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router.get("/filetypes", listFileTypes);
router
  .route("/")
  .get(getFileList)
  .post(upload.single("file"), uploadFiles)
  .put(updateFile)
  .delete(deleteFile);

router
  .route("/folders")
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    createFolder
  )
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    updateFolder
  )
  .delete(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    deleteFolder
  )
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    getFolderList
  );

router
  .route("/folder/move")
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    moveFolder
  );

router
  .route("/file/move")
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    moveFile
  );

router
  .route("/file/extension-images")
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    getExtensionImages
  )
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    upload.single("file"),
    uploadExtensionImage
  )
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    updateExtensionImage
  )
  .delete(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    deleteExtensionImage
  );

router
  .route("/file/metadata")
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    getFilesMetadata
  )
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    uploadFileMetadata
  );

router
  .route("/bucket")
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    getFilesFromS3
  );

router
  .route("/presigned-url")
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    createGetPresignedURL
  )
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    createPutPresignedURL
  );

module.exports = router;
