const express = require("express");
const { verifyEmailService } = require("../services/emailService");

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns server status and service connectivity
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/", async (req, res) => {
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    services: {
      gemini: geminiConfigured,
      email: emailConfigured,
    },
  });
});

module.exports = router;
