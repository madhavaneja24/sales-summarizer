const express = require("express");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const { upload } = require("../middleware/fileUpload");
const { uploadRateLimiter } = require("../middleware/rateLimiter");
const { parseFile } = require("../services/fileParser");
const { generateSummary } = require("../services/geminiService");
const { sendSummaryEmail } = require("../services/emailService");

const router = express.Router();

/**
 * @swagger
 * /api/summarize:
 *   post:
 *     summary: Upload a sales file and receive an AI summary via email
 *     description: |
 *       Upload a CSV or XLSX file containing sales data. The API will:
 *       1. Parse and validate the file
 *       2. Generate an AI-powered narrative summary using Google Gemini
 *       3. Send the formatted summary to the provided email address
 *
 *       **Rate Limit:** 10 requests per hour per IP
 *     tags:
 *       - Analysis
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - email
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or XLSX file (max 10MB)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Recipient email for the summary
 *                 example: analyst@company.com
 *     responses:
 *       200:
 *         description: Summary generated and email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SummarizeResponse'
 *       400:
 *         description: Invalid input (bad email, unsupported file, empty file)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: File exceeds 10MB limit
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error (AI or email service failure)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/summarize",
  uploadRateLimiter,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("A valid recipient email is required.")
      .normalizeEmail(),
  ],
  async (req, res, next) => {
    const requestId = uuidv4();

    try {
      // Validate email
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array().map((e) => e.msg),
        });
      }

      // Validate file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded. Please attach a CSV or XLSX file.",
        });
      }

      const { email } = req.body;
      const { buffer, originalname, size } = req.file;

      console.log(`[${requestId}] Processing: ${originalname} (${size} bytes) → ${email}`);

      // 1. Parse file
      let parsedData;
      try {
        parsedData = parseFile(buffer, originalname);
      } catch (parseErr) {
        return res.status(400).json({
          success: false,
          error: `File parsing failed: ${parseErr.message}`,
        });
      }

      console.log(`[${requestId}] Parsed ${parsedData.rowCount} rows, ${parsedData.headers.length} columns`);

      // 2. Generate AI summary
      let summaryHtml;
      try {
        summaryHtml = await generateSummary(parsedData, originalname);
      } catch (aiErr) {
        console.error(`[${requestId}] Gemini error:`, aiErr.message);
        return res.status(500).json({
          success: false,
          error: "AI summary generation failed. Please check your GEMINI_API_KEY.",
          details: [aiErr.message],
        });
      }

      console.log(`[${requestId}] Summary generated (${summaryHtml.length} chars)`);

      // 3. Send email
      try {
        await sendSummaryEmail(email, summaryHtml, originalname, parsedData.rowCount, requestId);
      } catch (emailErr) {
        console.error(`[${requestId}] Email error:`, emailErr.message);
        return res.status(500).json({
          success: false,
          error: "Failed to send email. Please check email configuration.",
          details: [emailErr.message],
        });
      }

      console.log(`[${requestId}] Email sent to ${email}`);

      return res.status(200).json({
        success: true,
        message: `Summary successfully sent to ${email}`,
        requestId,
        meta: {
          filename: originalname,
          rowCount: parsedData.rowCount,
          columns: parsedData.headers,
        },
        summary: summaryHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500) + "...",
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/preview:
 *   post:
 *     summary: Preview parsed file data without sending email
 *     description: Parse a CSV/XLSX file and return metadata, stats, and a sample. Useful for testing.
 *     tags:
 *       - Analysis
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File parsed successfully
 *       400:
 *         description: Invalid file
 */
router.post(
  "/preview",
  uploadRateLimiter,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded." });
      }

      const { buffer, originalname } = req.file;
      const parsedData = parseFile(buffer, originalname);

      return res.status(200).json({
        success: true,
        filename: originalname,
        rowCount: parsedData.rowCount,
        headers: parsedData.headers,
        preview: parsedData.preview,
        stats: parsedData.stats,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
