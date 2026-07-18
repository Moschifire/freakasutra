// src/utils/crypto.js
import CryptoJS from 'crypto-js';

/**
 * Derives a secure, stable cryptographic key from the user's password and a salt.
 * We use PBKDF2 (Password-Based Key Derivation Function 2) to prevent brute-force attacks.
 * @param {string} password - The user's plain-text password.
 * @param {string} salt - A stable string unique to the user (e.g., their username or hashed email).
 * @returns {string} - A stable key used for encryption/decryption.
 */
export const deriveKey = (password, salt) => {
    const iterations = 1000;
    const keySize = 256 / 32; // 256-bit key
    const derivedKey = CryptoJS.PBKDF2(password, salt, {
        keySize: keySize,
        iterations: iterations,
        hasher: CryptoJS.algo.SHA256
    });
    return derivedKey.toString(CryptoJS.enc.Base64);
};

/**
 * Encrypts any JSON-compatible data payload.
 * @param {any} data - The raw data to encrypt (object, array, string).
 * @param {string} secretKey - The key derived using deriveKey().
 * @returns {string} - The encrypted ciphertext string.
 */
export const encryptData = (data, secretKey) => {
    const stringifiedData = JSON.stringify(data);
    const ciphertext = CryptoJS.AES.encrypt(stringifiedData, secretKey).toString();
    return ciphertext;
};

/**
 * Decrypts a ciphertext string back into its original JSON data form.
 * @param {string} ciphertext - The encrypted string retrieved from the database.
 * @param {string} secretKey - The key derived using deriveKey().
 * @returns {any|null} - The decrypted JSON data, or null if decryption fails.
 */
export const decryptData = (ciphertext, secretKey) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) return null;
        return JSON.parse(decryptedText);
    } catch (error) {
        console.error('Decryption failed. Invalid key or corrupted data.', error.message);
        return null;
    }
};

/**
 * Generates a SHA-256 hash of the email.
 * This is used as the stable salt for PBKDF2 key derivation.
 * @param {string} email - The user's plain-text email.
 * @returns {string} - The SHA-256 hash of the email.
 */
export const hashEmailClient = (email) => {
    return CryptoJS.SHA256(email.toLowerCase().trim()).toString();
};