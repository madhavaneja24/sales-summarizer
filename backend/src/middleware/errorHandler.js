const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
  console.error(err.stack);

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: "File too large. Maximum size is 10MB.",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      error: "Unexpected file field. Use 'file' as the field name.",
    });
  }

  // Generic server error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error. Please try again later.",
  });
};

module.exports = { errorHandler };
