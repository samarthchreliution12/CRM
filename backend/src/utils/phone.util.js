const COUNTRY_CODES = [
  { code: "IN", dialCode: "+91", name: "India" },
  { code: "AE", dialCode: "+971", name: "UAE" },
  { code: "US", dialCode: "+1", name: "USA/Canada" },
  { code: "GB", dialCode: "+44", name: "UK" },
  { code: "SG", dialCode: "+65", name: "Singapore" },
  { code: "AU", dialCode: "+61", name: "Australia" },
  { code: "CA", dialCode: "+1", name: "Canada" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia" },
  { code: "QA", dialCode: "+974", name: "Qatar" },
  { code: "OM", dialCode: "+968", name: "Oman" },
  { code: "KW", dialCode: "+965", name: "Kuwait" },
  { code: "BH", dialCode: "+973", name: "Bahrain" },
  { code: "DE", dialCode: "+49", name: "Germany" },
  { code: "FR", dialCode: "+33", name: "France" },
  { code: "MY", dialCode: "+60", name: "Malaysia" },
  { code: "ZA", dialCode: "+27", name: "South Africa" },
  { code: "NZ", dialCode: "+64", name: "New Zealand" },
];

/**
 * Parse any raw phone string into country code and clean local number.
 * Examples:
 *   "+91 9876543210" -> { countryCode: "+91", localNumber: "9876543210", rawDigits: "919876543210" }
 *   "+919876543210"  -> { countryCode: "+91", localNumber: "9876543210", rawDigits: "919876543210" }
 *   "9876543210"     -> { countryCode: "+91", localNumber: "9876543210", rawDigits: "919876543210" }
 *   "09876543210"    -> { countryCode: "+91", localNumber: "9876543210", rawDigits: "919876543210" }
 *   "919876543210"   -> { countryCode: "+91", localNumber: "9876543210", rawDigits: "919876543210" }
 */
function parsePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { countryCode: "+91", localNumber: "", rawDigits: "" };
  }

  const trimmed = rawPhone.trim();

  // If starts with +, match longest dial code
  if (trimmed.startsWith("+")) {
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (trimmed.startsWith(c.dialCode)) {
        const local = trimmed.slice(c.dialCode.length).replace(/\D/g, "");
        return {
          countryCode: c.dialCode,
          localNumber: local,
          rawDigits: c.dialCode.replace(/\D/g, "") + local,
        };
      }
    }
  }

  // Remove non-digit characters
  let digits = trimmed.replace(/\D/g, "");

  // If starts with 0 and length is 11 (e.g. 09876543210):
  if (/^0[6-9]\d{9}$/.test(digits)) {
    const local = digits.slice(1);
    return {
      countryCode: "+91",
      localNumber: local,
      rawDigits: `91${local}`,
    };
  }

  // If 12 digits starting with 91 and next digit is 6-9 (e.g. 919876543210):
  if (/^91[6-9]\d{9}$/.test(digits)) {
    const local = digits.slice(2);
    return {
      countryCode: "+91",
      localNumber: local,
      rawDigits: digits,
    };
  }

  // If exactly 10 digits:
  if (/^\d{10}$/.test(digits)) {
    return {
      countryCode: "+91",
      localNumber: digits,
      rawDigits: `91${digits}`,
    };
  }

  // Fallback for other digits
  return {
    countryCode: "+91",
    localNumber: digits,
    rawDigits: digits,
  };
}

/**
 * Validate and normalize a phone number.
 */
function validateAndNormalizePhone(rawPhone, fieldLabel = "Mobile number") {
  if (!rawPhone || typeof rawPhone !== "string" || !rawPhone.trim()) {
    return {
      isValid: false,
      error: `${fieldLabel} is required`,
      formatted: null,
      e164: null,
      countryCode: "+91",
      localNumber: "",
    };
  }

  const parsed = parsePhone(rawPhone);
  const { countryCode, localNumber } = parsed;

  if (!localNumber) {
    return {
      isValid: false,
      error: `${fieldLabel} is required`,
      formatted: null,
      e164: null,
      countryCode,
      localNumber: "",
    };
  }

  if (countryCode === "+91") {
    if (localNumber.length !== 10) {
      return {
        isValid: false,
        error: `${fieldLabel} must be exactly 10 digits.`,
        formatted: null,
        e164: null,
        countryCode,
        localNumber,
      };
    }
    if (!/^[6-9]/.test(localNumber)) {
      return {
        isValid: false,
        error: `Invalid Indian ${fieldLabel.toLowerCase()} - must start with 6, 7, 8, or 9.`,
        formatted: null,
        e164: null,
        countryCode,
        localNumber,
      };
    }
  } else {
    if (localNumber.length < 7 || localNumber.length > 15) {
      return {
        isValid: false,
        error: `${fieldLabel} must be between 7 and 15 digits.`,
        formatted: null,
        e164: null,
        countryCode,
        localNumber,
      };
    }
  }

  const e164 = `${countryCode.replace(/\D/g, "")}${localNumber}`;
  const formatted = `${countryCode} ${localNumber}`;

  return {
    isValid: true,
    countryCode,
    localNumber,
    formatted,
    e164,
    error: null,
  };
}

/**
 * Formats a phone number for ChatterPillar WhatsApp API delivery.
 * Strips all symbols, spaces, and ensures 91 is prepended for Indian numbers.
 */
function formatForWhatsAppApi(rawPhone) {
  if (!rawPhone) return "";
  const parsed = parsePhone(String(rawPhone));
  if (parsed.localNumber) {
    const codeDigits = parsed.countryCode.replace(/\D/g, "") || "91";
    return `${codeDigits}${parsed.localNumber}`;
  }
  return String(rawPhone).replace(/\D/g, "");
}

module.exports = {
  COUNTRY_CODES,
  parsePhone,
  validateAndNormalizePhone,
  formatForWhatsAppApi,
};
