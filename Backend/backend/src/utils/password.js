const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

async function hashPassword(plainText) {
  return bcrypt.hash(String(plainText), SALT_ROUNDS);
}

async function verifyPassword(plainText, storedValue) {
  const candidate = String(plainText ?? "");
  const stored = String(storedValue ?? "");

  try {
    if (await bcrypt.compare(candidate, stored)) return true;
  } catch {
    // Ignore and fall back to legacy comparison.
  }

  // Legacy fallback: support plaintext values still in DB.
  return candidate === stored;
}

module.exports = { hashPassword, verifyPassword };

