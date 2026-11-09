// Pakistani mobile helpers.
//
// The form shows a fixed "+92" prefix and accepts the 10-digit national number
// (3XX XXXXXXX). The API still stores the local 03XX XXXXXXX form, so the
// helpers below convert between the two without changing the server contract.
export const PHONE_PREFIX = '+92';
export const PHONE_MAX_DIGITS = 10;

// Everything except digits, capped at the national-number length.
export const phoneDigits = (value) => String(value ?? '').replace(/\D/g, '').slice(0, PHONE_MAX_DIGITS);

// Keep the client rule in sync with server/utils/phone.js.
export const normalizePakistaniPhone = (value) => {
  let digits = String(value ?? '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+92')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('0092')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('92') && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.length === 10 && digits.startsWith('3')) digits = `0${digits}`;
  return digits;
};

export const isPakistaniPhone = (value) => /^03\d{9}$/.test(normalizePakistaniPhone(value));

// Stored local number (03XXXXXXXXX) -> the 10 digits shown after +92.
export const toNationalPhone = (value) => {
  const local = normalizePakistaniPhone(value);
  return local.startsWith('0') ? local.slice(1) : local;
};

// Group the national number as "3XX XXXXXXX" while the user types. Using
// toNationalPhone also means a pasted +92/0092 number is converted correctly.
export const formatNationalPhone = (value) => {
  const digits = toNationalPhone(value);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
};

export const isValidNationalPhone = (value) => /^3\d{9}$/.test(toNationalPhone(value));

export const PHONE_MESSAGE = 'Enter a valid Pakistani mobile number, e.g. +92 300 1234567';
