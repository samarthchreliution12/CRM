/**
 * UCC Generation Utility
 * Generates an 8-digit UCC (Client ID) from:
 * 1. The 4 numeric digits inside the PAN (positions 6-9)
 * 2. The Day (DD) and Month (MM) from the Date of Birth (DOB)
 *
 * Example:
 * PAN: CYZPC1015Q -> 1015
 * DOB: 12/09/2003 (or 2003-09-12) -> 1209
 * UCC: 10151209
 */

/**
 * Extracts 4 numeric digits from a valid PAN.
 * @param {string} pan 
 * @returns {string|null} 4 numeric digits or null
 */
function extractPanDigits(pan) {
  if (!pan || typeof pan !== "string") return null;
  const clean = pan.trim().toUpperCase();
  const panRegex = /^[A-Z]{5}([0-9]{4})[A-Z]{1}$/;
  const match = clean.match(panRegex);
  return match ? match[1] : null;
}

/**
 * Extracts DDMM (4 digits: 2 for day, 2 for month) from a Date of Birth string or Date object.
 * @param {string|Date} dob 
 * @returns {string|null} DDMM string or null
 */
function extractDobDDMM(dob) {
  if (!dob) return null;

  if (dob instanceof Date && !isNaN(dob.getTime())) {
    // If it's a valid Date object, format as ISO date string first to prevent timezone shifts
    const yyyy = dob.getFullYear();
    const mm = String(dob.getMonth() + 1).padStart(2, "0");
    const dd = String(dob.getDate()).padStart(2, "0");
    return `${dd}${mm}`;
  }

  const str = String(dob).trim();
  if (!str) return null;

  // Case 1: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
  if (ymdMatch) {
    const mm = ymdMatch[2].padStart(2, "0");
    const dd = ymdMatch[3].padStart(2, "0");
    return `${dd}${mm}`;
  }

  // Case 2: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, "0");
    const mm = dmyMatch[2].padStart(2, "0");
    return `${dd}${mm}`;
  }

  // Fallback: parse via Date
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    const dd = String(parsedDate.getUTCDate()).padStart(2, "0");
    const mm = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}${mm}`;
  }

  return null;
}

/**
 * Generates an 8-digit UCC from PAN and DOB.
 * @param {string} pan
 * @param {string|Date} dob
 * @returns {string|null} 8-digit UCC string or null
 */
function generateUccFromPanAndDob(pan, dob) {
  const panDigits = extractPanDigits(pan);
  if (!panDigits) return null;

  const ddmm = extractDobDDMM(dob);
  if (!ddmm) return null;

  const ucc = `${panDigits}${ddmm}`;
  if (ucc.length !== 8 || !/^\d{8}$/.test(ucc)) {
    return null;
  }

  return ucc;
}

module.exports = {
  extractPanDigits,
  extractDobDDMM,
  generateUccFromPanAndDob,
};
