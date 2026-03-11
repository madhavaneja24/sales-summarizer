const multer = require("multer");
const path = require("path");

const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/csv",
  "text/plain",
];

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (!extOk) {
    return cb(
      new Error(`Invalid file type. Only CSV and XLSX files are allowed. Got: ${ext}`),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
  fileFilter,
});

module.exports = { upload };
