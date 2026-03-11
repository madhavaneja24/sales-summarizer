const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI;

function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Generate a professional sales summary using Gemini
 * @param {object} parsedData - Output from fileParser
 * @param {string} filename - Original filename
 * @returns {Promise<string>} - HTML-formatted summary
 */
async function generateSummary(parsedData, filename) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const { headers, rowCount, stats, preview } = parsedData;

  const statsJson = JSON.stringify(stats, null, 2);
  const previewJson = JSON.stringify(preview, null, 2);

  const prompt = `You are a senior business analyst. Analyze the following sales data and produce a professional, executive-level summary.

FILE: ${filename}
TOTAL ROWS: ${rowCount}
COLUMNS: ${headers.join(", ")}

COLUMN STATISTICS:
${statsJson}

SAMPLE ROWS (first 5):
${previewJson}

INSTRUCTIONS:
1. Write a clear, professional narrative summary (400-600 words)
2. Highlight key metrics: total revenue, top performers, trends, anomalies
3. Include actionable insights or observations
4. Structure with these sections: Executive Summary, Key Metrics, Notable Trends, Recommendations
5. Use professional business language
6. Format your response in clean HTML with inline styles suitable for email (use <h2>, <p>, <ul>, <strong>, <table> tags)
7. Use a color scheme: headings in #1e3a5f, highlights in #e63946, positive trends in #2d6a4f

Produce ONLY the HTML content (no doctype, no <html>/<body> tags, just the inner content).`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return text;
}

module.exports = { generateSummary };
