import React, { useRef, useEffect } from "react";
import "./OtpInput.css";

const OtpInput = ({ value = "", onChange, length = 6, disabled = false, autoFocus = true }) => {
  const inputRefs = useRef([]);

  // Ensure digits array matches required length
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (e, index) => {
    const rawVal = e.target.value;
    // Keep only numbers
    const cleanVal = rawVal.replace(/\D/g, "");

    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = "";
      onChange(newDigits.join(""));
      return;
    }

    // If multiple digits typed/pasted
    if (cleanVal.length > 1) {
      handlePasteValue(cleanVal, index);
      return;
    }

    const newDigit = cleanVal[cleanVal.length - 1];
    const newDigits = [...digits];
    newDigits[index] = newDigit;
    const combined = newDigits.join("");
    onChange(combined);

    // Focus next box
    if (index < length - 1 && newDigit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e, index) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const cleanPaste = pasteData.replace(/\D/g, "");
    if (cleanPaste) {
      handlePasteValue(cleanPaste, index);
    }
  };

  const handlePasteValue = (pastedDigits, startIndex) => {
    const newDigits = [...digits];
    let pasteIndex = 0;

    for (let i = startIndex; i < length && pasteIndex < pastedDigits.length; i++) {
      newDigits[i] = pastedDigits[pasteIndex];
      pasteIndex++;
    }

    const combined = newDigits.join("");
    onChange(combined);

    // Focus on the slot after the last pasted digit
    const nextFocusIndex = Math.min(startIndex + pasteIndex, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  return (
    <div className="otp-container">
      <div className="otp-slots-row">
        {digits.map((digit, idx) => (
          <React.Fragment key={idx}>
            {idx === 3 && <span className="otp-divider" aria-hidden="true">—</span>}
            <input
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={(e) => handlePaste(e, idx)}
              onFocus={(e) => e.target.select()}
              className={`otp-slot ${digit ? "filled" : ""}`}
              aria-label={`Digit ${idx + 1}`}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default OtpInput;
