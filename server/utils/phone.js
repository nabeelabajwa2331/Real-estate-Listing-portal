// Pakistani mobile numbers: 03XX XXXXXXX (11 digits) or +92 3XX XXXXXXX.
// Formatting (spaces, dashes) and the country-code-only form are accepted, then
// normalised to the local 03XXXXXXXXX shape used by the database.
export const normalizePakistaniPhone = (value) => {
  let digits = String(value ?? '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+92')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('0092')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('92') && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.length === 10 && digits.startsWith('3')) digits = `0${digits}`;
  return digits;
};

export const isPakistaniPhone = (value) => /^03\d{9}$/.test(normalizePakistaniPhone(value));

export const PHONE_MESSAGE =
  'Enter a valid Pakistani mobile number (03XX XXXXXXX or +92 3XX XXXXXXX)';
