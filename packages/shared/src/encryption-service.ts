import CryptoJS from 'crypto-js';

export class EncryptionService {
    /**
     * Encrypts a message using a lobby-specific key.
     * @param message Plaintext message.
     * @param key Lobby encryption key.
     * @returns Encrypted payload.
     */
    static encrypt(message: string, key: string): string {
        return CryptoJS.AES.encrypt(message, key).toString();
    }

    /**
     * Decrypts an encrypted payload.
     * @param ciphertext Encrypted payload.
     * @param key Lobby encryption key.
     * @returns Plaintext message.
     */
    static decrypt(ciphertext: string, key: string): string {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    /**
     * Generates a unique encryption key for a match.
     */
    static generateKey(): string {
        return CryptoJS.lib.WordArray.random(32).toString();
    }
}
