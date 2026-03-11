const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sales Summarizer API",
      version: "1.0.0",
      description:
        "Upload CSV/XLSX sales data, get an AI-generated summary emailed to you. Built with MERN stack + Google Gemini.",
      contact: {
        name: "API Support",
        email: "support@salessummarizer.com",
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:5000",
        description: "Current Server",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "Optional API key for authenticated access",
        },
      },
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            timestamp: { type: "string", format: "date-time" },
            uptime: { type: "number", example: 123.45 },
            services: {
              type: "object",
              properties: {
                gemini: { type: "boolean", example: true },
                email: { type: "boolean", example: true },
              },
            },
          },
        },
        SummarizeResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Summary sent to john@example.com" },
            summary: { type: "string", example: "Total revenue: $125,000..." },
            requestId: { type: "string", example: "uuid-v4-string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Invalid file format" },
            details: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
