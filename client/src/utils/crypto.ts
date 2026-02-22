import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default_secret';

// Encrypt Message (Turn "Hello" into "U2FsdGVkX1...")
export const encryptMessage = (text: string): string => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

// Decrypt Message (Turn "U2FsdGVkX1..." back to "Hello")
export const decryptMessage = (cipherText: string): string => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption fails (e.g., wrong key or unencrypted old msg), return original
    return originalText || cipherText; 
  } catch (error) {
    return cipherText; // Fallback for old unencrypted messages
  }
};