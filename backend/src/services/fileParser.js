const XLSX = require("xlsx");
const path = require("path");

/**
 * Parse uploaded file buffer into structured JSON data
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original filename
 * @returns {{ headers: string[], rows: object[], rowCount: number, preview: object[] }}
 */
function parseFile(buffer, originalname) {
  const ext = path.extname(originalname).toLowerCase();

  let workbook;

  if (ext === ".csv") {
    const csvString = buffer.toString("utf8");
    workbook = XLSX.read(csvString, { type: "string" });
  } else if (ext === ".xlsx" || ext === ".xls") {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } else {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No sheets found in the uploaded file.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (!rows || rows.length === 0) {
    throw new Error("The uploaded file is empty or has no data rows.");
  }

  const headers = Object.keys(rows[0]);

  // Build numeric column stats
  const stats = buildStats(headers, rows);

  return {
    headers,
    rows,
    rowCount: rows.length,
    preview: rows.slice(0, 5),
    stats,
    sheetName,
  };
}

function buildStats(headers, rows) {
  const stats = {};

  headers.forEach((header) => {
    const values = rows
      .map((r) => parseFloat(String(r[header]).replace(/[,$%]/g, "")))
      .filter((v) => !isNaN(v));

    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      stats[header] = {
        min: Math.min(...values),
        max: Math.max(...values),
        sum: parseFloat(sum.toFixed(2)),
        avg: parseFloat((sum / values.length).toFixed(2)),
        count: values.length,
      };
    } else {
      // Categorical column — count unique values
      const unique = [...new Set(rows.map((r) => r[header]))].filter(Boolean);
      stats[header] = {
        type: "categorical",
        uniqueValues: unique.slice(0, 20),
        uniqueCount: unique.length,
      };
    }
  });

  return stats;
}

module.exports = { parseFile };
