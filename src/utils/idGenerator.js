/**
 * Unique ID generator for Kisan Portal bookings and payments
 */

export const generateSellingId = () => {
  const year = new Date().getFullYear();
  // Generate 6 digit random number padded with zeros
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `KS-${year}-${randomNum}`;
};

export const generatePaymentId = () => {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'PAY-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const maskAccountNumber = (accNumber) => {
  if (!accNumber) return 'XXXXXXXX----';
  const clean = String(accNumber).trim();
  if (clean.length <= 4) return 'XXXXXXXX' + clean;
  const last4 = clean.slice(-4);
  return 'XXXXXXXX' + last4;
};
