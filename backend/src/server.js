require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const uploadRouter = require("./routes/upload");
const healthRouter = require("./routes/health");
const { globalRateLimiter } = require("./middleware/rateLimiter");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

app.use(globalRateLimiter);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/health", healthRouter);
app.use("/api", uploadRouter);

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { background: #0f172a; }",
    customSiteTitle: "Sales Summarizer API Docs",
  })
);

app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Sales Summarizer API",
    version: "1.0.0",
    docs: `${req.protocol}://${req.get("host")}/api-docs`,
    health: `${req.protocol}://${req.get("host")}/api/health`,
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
