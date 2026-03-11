const rateLimit = require("express-rate-limit");

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
  skip: (req) => req.path === "/api/health",
});

const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Upload limit reached. Maximum 10 uploads per hour per IP.",
  },
});

module.exports = { globalRateLimiter, uploadRateLimiter };
