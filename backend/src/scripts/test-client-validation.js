const { validateCreateClientInput, validateUpdateClientInput } = require('../validators/client.validator');

console.log("=== RUNNING CLIENT VALIDATION TESTS ===");
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// Helper to get error message for field
function getFieldError(res, fieldName) {
  if (!res || !res.errors) return null;
  const err = res.errors.find(e => e.field === fieldName);
  return err ? err.message : null;
}

const baseValidClient = {
  name: "John Doe",
  ucc_no: "UCC1001",
  mobile_no: "9876543210",
  whatsapp_no: "9876543210",
  email: "john@example.com",
  pan: "ABCDE1234F",
  dob: "1990-01-01",
  gender: "male",
  client_type_id: 1,
  status: "active"
};

// Test 1: Valid client passes validation
{
  const res = validateCreateClientInput(baseValidClient);
  assert(res.isValid === true && res.errors.length === 0, "Valid client input should pass validation");
}

// Test 2: DOB Under 18 Years Rejection
{
  const today = new Date();
  const seventeenYearsAgo = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const res = validateCreateClientInput({ ...baseValidClient, dob: seventeenYearsAgo });
  assert(
    getFieldError(res, "dob") === "Client must be at least 18 years old.",
    `Under 18 DOB (${seventeenYearsAgo}) should be rejected with 'Client must be at least 18 years old.'`
  );
}

// Test 3: Future DOB Rejection
{
  const futureDate = "2099-01-01";
  const res = validateCreateClientInput({ ...baseValidClient, dob: futureDate });
  assert(
    getFieldError(res, "dob") === "Date of birth cannot be in the future",
    `Future DOB (${futureDate}) should be rejected with 'Date of birth cannot be in the future'`
  );
}

// Test 4: Invalid Email Formats (abc, abc@, @gmail.com, abc@gmail)
{
  const invalidEmails = ["abc", "abc@", "@gmail.com", "abc@gmail"];
  for (const email of invalidEmails) {
    const res = validateCreateClientInput({ ...baseValidClient, email });
    assert(
      getFieldError(res, "email") === "Please enter a valid email address.",
      `Invalid email '${email}' should be rejected with 'Please enter a valid email address.'`
    );
  }
}

// Test 5: Valid Email Formats
{
  const validEmails = ["john.doe@example.com", "john_123@domain.co.in", "test@company.org"];
  for (const email of validEmails) {
    const res = validateCreateClientInput({ ...baseValidClient, email });
    assert(
      getFieldError(res, "email") === null,
      `Valid email '${email}' should pass validation`
    );
  }
}

// Test 6: Invalid WhatsApp Number Formats
{
  const invalidPhones = ["123", "abc", "12345678901234567"]; // < 10 digits, letters, > 15 digits
  for (const phone of invalidPhones) {
    const res = validateCreateClientInput({ ...baseValidClient, whatsapp_no: phone });
    const err = getFieldError(res, "whatsapp_no");
    assert(
      err === "WhatsApp number is required" || err === "Please enter a valid WhatsApp number.",
      `Invalid WhatsApp '${phone}' should be rejected`
    );
  }
}

// Test 7: Missing Required Fields
{
  const res = validateCreateClientInput({});
  assert(getFieldError(res, "name") !== null, "Missing name returned error");
  assert(getFieldError(res, "ucc_no") !== null, "Missing UCC number returned error");
  assert(getFieldError(res, "mobile_no") !== null, "Missing mobile number returned error");
  assert(getFieldError(res, "whatsapp_no") !== null, "Missing WhatsApp number returned error");
  assert(getFieldError(res, "email") !== null, "Missing email returned error");
  assert(getFieldError(res, "pan") !== null, "Missing PAN returned error");
  assert(getFieldError(res, "dob") !== null, "Missing DOB returned error");
  assert(getFieldError(res, "gender") !== null, "Missing gender returned error");
  assert(getFieldError(res, "client_type_id") !== null, "Missing client_type_id returned error");
}

// Test 8: Partial Update Validation (validateUpdateClientInput)
{
  const res = validateUpdateClientInput({ email: "invalid-email", dob: "2020-01-01" });
  assert(getFieldError(res, "email") === "Please enter a valid email address.", "Update with invalid email caught");
  assert(getFieldError(res, "dob") === "Client must be at least 18 years old.", "Update with under 18 DOB caught");
}

console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL VALIDATION TESTS PASSED PERFECTLY!");
}
