import React from "react";
import { COUNTRY_CODES, parsePhoneNumber } from "../../utils/phone.util";
import "./PhoneInput.css";

const PhoneInput = ({
  countryCode = "+91",
  phone = "",
  onCountryCodeChange,
  onPhoneChange,
  name = "phone",
  id,
  placeholder,
  disabled = false,
  readOnly = false,
  isInvalid = false,
  onBlur,
  required = false,
  className = "",
}) => {
  const currentCode = countryCode || "+91";

  const handlePhoneInputChange = (e) => {
    let val = e.target.value;

    // Intelligently handle paste of full numbers with country code or leading 0
    if (val.includes("+") || val.startsWith("0") || val.length > 10) {
      const parsed = parsePhoneNumber(val);
      if (parsed.countryCode && onCountryCodeChange) {
        onCountryCodeChange(parsed.countryCode);
      }
      val = parsed.phone;
    } else {
      val = val.replace(/\D/g, "");
    }

    // Clamp length: for India (+91) strictly max 10 digits
    if (currentCode === "+91") {
      val = val.slice(0, 10);
    } else {
      val = val.slice(0, 15);
    }

    if (onPhoneChange) {
      onPhoneChange(val);
    }
  };

  const dynamicPlaceholder =
    placeholder ||
    (currentCode === "+91" ? "10-digit mobile (e.g. 98765 43210)" : "Enter phone number");

  return (
    <div
      className={`phone-input-group ${isInvalid ? "is-invalid" : ""} ${
        disabled || readOnly ? "is-disabled" : ""
      } ${className}`}
    >
      <select
        className="phone-country-select"
        value={currentCode}
        onChange={(e) => onCountryCodeChange && onCountryCodeChange(e.target.value)}
        disabled={disabled || readOnly}
        aria-label="Country Code"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
            {c.flag} {c.dialCode}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        id={id}
        name={name}
        className="phone-number-input"
        placeholder={dynamicPlaceholder}
        value={phone}
        onChange={handlePhoneInputChange}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={currentCode === "+91" ? 10 : 15}
        autoComplete="tel"
        required={required}
      />
    </div>
  );
};

export default PhoneInput;
