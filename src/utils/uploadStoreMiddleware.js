const multer = require("multer");
const mimeTypes = require("mime-types");

const FILE_SIZE_LIMIT = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    const mimeType = mimeTypes.lookup(file.originalname);

    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return cb(
        new Error(
          `File type not allowed. Only allowed: ${ALLOWED_MIME_TYPES.join(
            ", "
          )}`
        ),
        false
      );
    }

    const extension = mimeTypes.extension(mimeType);
    if (!extension) {
      return cb(new Error("Could not determine the file extension"), false);
    }

    cb(null, true);
  } catch (error) {
    cb(new Error(`Error validating file: ${error.message}`));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
    files: 5,
  },
});

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: `File too large. Maximum allowed: ${
          FILE_SIZE_LIMIT / (1024 * 1024)
        }MB`,
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files. Maximum 5 files allowed",
      });
    }
    return res.status(400).json({ error: error.message });
  }

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError,
};
