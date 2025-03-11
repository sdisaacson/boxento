/**
 * Simple encryption utilities for Boxento
 * 
 * These utilities provide basic protection for sensitive data
 * stored in localStorage. This is not intended for high-security
 * applications but provides a minimal layer of protection.
 */

export const encryptionUtils = {
  /**
   * Encrypt a string using base64 encoding
   * 
   * @param text - Text to encrypt
   * @returns Encrypted text
   */
  encrypt: (text: string): string => {
    if (!text) return '';
    try {
      // Simple encryption using base64 encoding
      // For production, a more robust encryption method would be used
      return btoa(text);
    } catch (e) {
      console.error('Encryption failed', e);
      return '';
    }
  },
  
  /**
   * Decrypt a string that was encrypted with the encrypt method
   * 
   * @param encryptedText - Text to decrypt
   * @returns Decrypted text
   */
  decrypt: (encryptedText: string): string => {
    if (!encryptedText) return '';
    try {
      return atob(encryptedText);
    } catch (e) {
      console.error('Decryption failed', e);
      return '';
    }
  },

  /**
   * Process an object, encrypting any sensitive fields
   * 
   * @param obj - Object to process
   * @param sensitiveFields - Array of field names that should be encrypted
   * @returns Processed object with encrypted sensitive fields
   */
  processObjectForStorage: (obj: Record<string, unknown>, sensitiveFields: string[] = ['apiKey', 'token', 'secret']): Record<string, unknown> => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result = { ...obj };
    
    sensitiveFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = encryptionUtils.encrypt(result[field]);
      }
    });
    
    return result;
  },
  
  /**
   * Process an object, decrypting any sensitive fields
   * 
   * @param obj - Object to process
   * @param sensitiveFields - Array of field names that should be decrypted
   * @returns Processed object with decrypted sensitive fields
   */
  processObjectFromStorage: (obj: Record<string, unknown>, sensitiveFields: string[] = ['apiKey', 'token', 'secret']): Record<string, unknown> => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result = { ...obj };
    
    sensitiveFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = encryptionUtils.decrypt(result[field]);
      }
    });
    
    return result;
  }
};