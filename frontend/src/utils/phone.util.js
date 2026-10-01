export const COUNTRY_CODES = [
  { code: "IN", dialCode: "+91", label: "+91 (India)", flag: "🇮🇳", name: "India" },
  { code: "AE", dialCode: "+971", label: "+971 (UAE)", flag: "🇦🇪", name: "UAE" },
  { code: "US", dialCode: "+1", label: "+1 (USA/Canada)", flag: "🇺🇸", name: "USA" },
  { code: "GB", dialCode: "+44", label: "+44 (UK)", flag: "🇬🇧", name: "UK" },
  { code: "SG", dialCode: "+65", label: "+65 (Singapore)", flag: "🇸🇬", name: "Singapore" },
  { code: "AU", dialCode: "+61", label: "+61 (Australia)", flag: "🇦🇺", name: "Australia" },
  { code: "CA", dialCode: "+1", label: "+1 (Canada)", flag: "🇨🇦", name: "Canada" },
  { code: "SA", dialCode: "+966", label: "+966 (Saudi Arabia)", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "QA", dialCode: "+974", label: "+974 (Qatar)", flag: "🇶🇦", name: "Qatar" },
  { code: "OM", dialCode: "+968", label: "+968 (Oman)", flag: "🇴🇲", name: "Oman" },
  { code: "KW", dialCode: "+965", label: "+965 (Kuwait)", flag: "🇰🇼", name: "Kuwait" },
  { code: "BH", dialCode: "+973", label: "+973 (Bahrain)", flag: "🇧🇭", name: "Bahrain" },
  { code: "DE", dialCode: "+49", label: "+49 (Germany)", flag: "🇩🇪", name: "Germany" },
  { code: "FR", dialCode: "+33", label: "+33 (France)", flag: "🇫🇷", name: "France" },
  { code: "MY", dialCode: "+60", label: "+60 (Malaysia)", flag: "🇲🇾", name: "Malaysia" },
  { code: "ZA", dialCode: "+27", label: "+27 (South Africa)", flag: "🇿🇦", name: "South Africa" },
  { code: "NZ", dialCode: "+64", label: "+64 (New Zealand)", flag: "🇳🇿", name: "New Zealand" },
];

/**
 * Parse any raw phone string into country code and local number.
 * Examples:
 *   "+91 9876543210" -> { countryCode: "+91", phone: "9876543210" }
 *   "+919876543210"  -> { countryCode: "+91", phone: "9876543210" }
 *   "9876543210"     -> { countryCode: "+91", phone: "9876543210" }
 *   "09876543210"    -> { countryCode: "+91", phone: "9876543210" }
 *   "919876543210"   -> { countryCode: "+91", phone: "9876543210" }
 */
export function parsePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { countryCode: "+91", phone: "" };
  }

  const trimmed = rawPhone.trim();

  // If starts with +, match known dial code
  if (trimmed.startsWith("+")) {
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (trimmed.startsWith(c.dialCode)) {
        const local = trimmed.slice(c.dialCode.length).replace(/\D/g, "");
        return {
          countryCode: c.dialCode,
          phone: local,
        };
      }
    }
  }

  // Pure digits without +
  let digits = trimmed.replace(/\D/g, "");

  // If starts with 0 and length is 11:
  if (/^0[6-9]\d{9}$/.test(digits)) {
    return {
      countryCode: "+91",
      phone: digits.slice(1),
    };
  }

  // If 12 digits starting with 91 and next is 6-9:
  if (/^91[6-9]\d{9}$/.test(digits)) {
    return {
      countryCode: "+91",
      phone: digits.slice(2),
    };
  }

  // If 10 digits:
  if (/^\d{10}$/.test(digits)) {
    return {
      countryCode: "+91",
      phone: digits,
    };
  }

  return {
    countryCode: "+91",
    phone: digits,
  };
}

/**
 * Format phone string with country code for storage / display.
 */
export function formatPhoneNumber(countryCode = "+91", phoneDigits = "") {
  if (!phoneDigits) return "";
  const clean = phoneDigits.replace(/\D/g, "");
  if (!clean) return "";
  const code = countryCode ? countryCode.trim() : "+91";
  return `${code} ${clean}`;
}

/**
 * Validate phone number based on country code and length.
 */
export function validatePhoneNumber(countryCode, phoneDigits, fieldName = "Mobile Number") {
  if (!phoneDigits || !phoneDigits.toString().trim()) {
    return `${fieldName} is required`;
  }

  const clean = phoneDigits.toString().replace(/\D/g, "");
  if (!clean) {
    return `${fieldName} is required`;
  }

  const code = countryCode ? countryCode.trim() : "+91";

  if (code === "+91") {
    if (clean.length !== 10) {
      return `${fieldName} must be exactly 10 digits`;
    }
    if (!/^[6-9]/.test(clean)) {
      return `Invalid Indian mobile number. Must start with 6, 7, 8, or 9`;
    }
  } else {
    if (clean.length < 7 || clean.length > 15) {
      return `${fieldName} must be between 7 and 15 digits`;
    }
  }

  return "";
}

/**
 * Mask mobile number to preserve country code and show last 2 digits.
 * Example: "+91 9876543210" -> "+91 98******10"
 * Example: "9876543210" -> "+91 98******10"
 */
export function maskMobileWithCountry(phoneStr) {
  if (!phoneStr || typeof phoneStr !== "string") return "";
  const parsed = parsePhoneNumber(phoneStr);
  const code = parsed.countryCode || "+91";
  const num = parsed.phone;

  if (num.length <= 4) {
    return `${code} ${"*".repeat(num.length)}`;
  }

  const first2 = num.slice(0, 2);
  const last2 = num.slice(-2);
  const stars = "*".repeat(Math.max(4, num.length - 4));
  return `${code} ${first2}${stars}${last2}`;
}
