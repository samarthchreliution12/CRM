/**
 * CSV Utility for robust RFC-4180 compliant CSV parsing, formula injection defense,
 * and CSV generation.
 */

/**
 * Parse CSV text into array of row objects using header row.
 * Handles quoted cells with commas, newlines, and escaped quotes ("").
 */
function parseCSV(csvText) {
  if (!csvText || typeof csvText !== "string") return [];

  // Strip UTF-8 BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return [];

  const lines = [];
  let currentCell = "";
  let inQuotes = false;
  let currentRow = [];

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // Skip \n after \r
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length < 2) return [];

  // Normalize header keys (lowercase, trimmed, underscores)
  const rawHeaders = lines[0];
  const headers = rawHeaders.map((h) =>
    h
      .toLowerCase()
      .trim()
      .replace(/[\s\-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
  );

  const dataRows = [];
  for (let r = 1; r < lines.length; r++) {
    const rowCells = lines[r];
    const rowObj = { _rowNumber: r + 1 };
    for (let c = 0; c < headers.length; c++) {
      const headerKey = headers[c];
      if (headerKey) {
        rowObj[headerKey] = rowCells[c] !== undefined ? rowCells[c] : "";
      }
    }
    dataRows.push(rowObj);
  }

  return dataRows;
}

/**
 * Sanitize cell text against CSV Formula Injection (Excel / Sheets execution vulnerability).
 */
function sanitizeCellForCSV(val) {
  if (val === null || val === undefined) return "";
  let str = String(val);

  // If starts with formula triggers (=, +, -, @), prepend single quote
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generate CSV string from headers array and data rows.
 */
function generateCSV(headers, rows) {
  const headerLine = headers.map((h) => sanitizeCellForCSV(h)).join(",");
  const dataLines = rows.map((row) => {
    if (Array.isArray(row)) {
      return row.map((cell) => sanitizeCellForCSV(cell)).join(",");
    }
    return headers
      .map((h) => {
        const key = h.toLowerCase().trim().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
        return sanitizeCellForCSV(row[key] !== undefined ? row[key] : "");
      })
      .join(",");
  });

  return [headerLine, ...dataLines].join("\n");
}

module.exports = {
  parseCSV,
  sanitizeCellForCSV,
  generateCSV,
};
