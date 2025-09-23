import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Field-level encryption using AES-256-GCM
export class FieldEncryption {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 32; // 256 bits

  constructor(private readonly masterKey: string) {
    if (!masterKey || masterKey.length < 32) {
      throw new Error('Master key must be at least 32 characters long');
    }
  }

  /**
   * Derives an encryption key from the master key and salt.
   */
  private async deriveKey(salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(this.masterKey, salt, this.keyLength)) as Buffer;
  }

  /**
   * Encrypt sensitive field data.
   *
   * This function generates a random salt and initialization vector (IV), derives a cryptographic key,
   * and then encrypts the provided plaintext using the specified algorithm. It sets the salt as additional
   * authenticated data (AAD) and combines the salt, IV, authentication tag, and ciphertext into a single
   * buffer before returning the result as a base64-encoded string.
   *
   * @param {string} plaintext - The plaintext data to be encrypted.
   */
  async encrypt(plaintext: string): Promise<string> {
    try {
      const salt = randomBytes(this.saltLength);
      const iv = randomBytes(this.ivLength);
      const key = await this.deriveKey(salt);

      const cipher = createCipheriv(this.algorithm, key, iv);
      cipher.setAAD(salt); // Use salt as additional authenticated data

      let ciphertext = cipher.update(plaintext, 'utf8');
      ciphertext = Buffer.concat([ciphertext, cipher.final()]);
      
      const tag = cipher.getAuthTag();

      // Combine salt + iv + tag + ciphertext
      const encrypted = Buffer.concat([salt, iv, tag, ciphertext]);
      
      return encrypted.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt sensitive field data.
   *
   * This function takes an encrypted string, decodes it from base64, and extracts the salt, initialization vector (iv), authentication tag, and ciphertext. It derives a decryption key using the salt, then creates a decipher instance to decrypt the ciphertext. The resulting plaintext is returned as a UTF-8 string. If any errors occur during the process, an error is thrown with a descriptive message.
   *
   * @param {string} encryptedData - The base64-encoded string containing the encrypted data.
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      const encrypted = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = encrypted.subarray(0, this.saltLength);
      const iv = encrypted.subarray(this.saltLength, this.saltLength + this.ivLength);
      const tag = encrypted.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const ciphertext = encrypted.subarray(this.saltLength + this.ivLength + this.tagLength);

      const key = await this.deriveKey(salt);

      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      decipher.setAAD(salt);

      let plaintext = decipher.update(ciphertext);
      plaintext = Buffer.concat([plaintext, decipher.final()]);

      return plaintext.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Encrypt multiple fields at once.
   */
  async encryptFields(fields: Record<string, string>): Promise<Record<string, string>> {
    const encrypted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        encrypted[key] = await this.encrypt(value);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt multiple fields at once.
   *
   * This function takes an object containing fields to be decrypted. It iterates over each field, attempting to decrypt its value using the `decrypt` method. If decryption fails for any field, an error is logged, and the field is marked as '[DECRYPTION_FAILED]'. The function returns an object containing the decrypted values or error indicators for each field.
   *
   * @param {Record<string, string>} fields - An object where each key corresponds to a field name and each value is the encrypted string to be decrypted.
   */
  async decryptFields(fields: Record<string, string>): Promise<Record<string, string>> {
    const decrypted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        try {
          decrypted[key] = await this.decrypt(value);
        } catch (error) {
          // Log error but don't fail completely
          console.error(`Failed to decrypt field ${key}:`, error);
          decrypted[key] = '[DECRYPTION_FAILED]';
        }
      }
    }
    
    return decrypted;
  }
}

// Global encryption instance
let encryptionInstance: FieldEncryption | null = null;

/**
 * Retrieves the FieldEncryption instance, creating it if it doesn't exist.
 */
export function getEncryption(): FieldEncryption {
  if (!encryptionInstance) {
    const masterKey = process.env.ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    encryptionInstance = new FieldEncryption(masterKey);
  }
  return encryptionInstance;
}

// Encrypted field markers for database schema
export const ENCRYPTED_FIELDS = {
  // Customer sensitive data
  CUSTOMER_SSN: 'customers.ssn',
  CUSTOMER_TAX_ID: 'customers.taxId',
  CUSTOMER_BANK_ACCOUNT: 'customers.bankAccount',
  CUSTOMER_NOTES: 'customers.sensitiveNotes',

  // Credit account sensitive data
  CREDIT_ACCOUNT_DETAILS: 'creditAccounts.accountDetails',
  CREDIT_GUARANTOR_INFO: 'creditAccounts.guarantorInfo',
  CREDIT_INTERNAL_NOTES: 'creditAccounts.internalNotes',

  // Payment sensitive data
  PAYMENT_ACCOUNT_DETAILS: 'payments.accountDetails',
  PAYMENT_ROUTING_NUMBER: 'payments.routingNumber',
  PAYMENT_ACCOUNT_NUMBER: 'payments.accountNumber',

  // User sensitive data
  USER_PERSONAL_INFO: 'users.personalInfo',
  USER_EMERGENCY_CONTACT: 'users.emergencyContact',
} as const;

// Helper functions for database operations
/**
 * Encrypts specified fields in the provided data object.
 *
 * This function takes an object and an array of field names, encrypting the values of those fields if they are strings.
 * It utilizes the `getEncryption` function to obtain the encryption mechanism and processes each field in the `fieldsToEncrypt` array.
 * The resulting object with encrypted fields is returned.
 *
 * @param data - The object containing fields to potentially encrypt.
 * @param fieldsToEncrypt - An array of field names that should be encrypted.
 */
export async function encryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: string[]
): Promise<T> {
  const encryption = getEncryption();
  const result = { ...data } as any;

  for (const field of fieldsToEncrypt) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = await encryption.encrypt(result[field]);
    }
  }

  return result;
}

/**
 * Decrypts specified sensitive fields in the provided data object.
 *
 * This function retrieves the encryption mechanism using getEncryption, then iterates over the fieldsToDecrypt array.
 * For each field, it checks if the field exists and is a string, attempting to decrypt it. If decryption fails, it logs an error
 * and replaces the field's value with '[ENCRYPTED]'. The function returns a new object with the decrypted fields.
 *
 * @param data - The object containing sensitive fields to be decrypted.
 * @param fieldsToDecrypt - An array of field names that need to be decrypted.
 */
export async function decryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: string[]
): Promise<T> {
  const encryption = getEncryption();
  const result = { ...data } as any;

  for (const field of fieldsToDecrypt) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = await encryption.decrypt(result[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        result[field] = '[ENCRYPTED]';
      }
    }
  }

  return result;
}

// Key rotation utilities
export interface KeyRotationPlan {
  currentKeyId: string;
  newKeyId: string;
  rotationStarted: Date;
  rotationCompleted?: Date;
  tablesAffected: string[];
}

export class KeyRotationManager {
  private rotationPlans = new Map<string, KeyRotationPlan>();

  /**
   * Starts the key rotation process.
   */
  async startRotation(plan: Omit<KeyRotationPlan, 'rotationStarted'>): Promise<void> {
    const fullPlan: KeyRotationPlan = {
      ...plan,
      rotationStarted: new Date(),
    };

    this.rotationPlans.set(plan.newKeyId, fullPlan);

    // In a real implementation, this would:
    // 1. Create new encryption instance with new key
    // 2. Start background job to re-encrypt all affected data
    // 3. Update database records to use new key ID
    // 4. Mark old key for deprecation after rotation complete

    console.log(`Key rotation started for key ${plan.newKeyId}`);
  }

  /**
   * Retrieves the rotation status for a given key ID.
   */
  getRotationStatus(keyId: string): KeyRotationPlan | null {
    return this.rotationPlans.get(keyId) || null;
  }

  /**
   * Completes the key rotation for the specified keyId.
   */
  async completeRotation(keyId: string): Promise<void> {
    const plan = this.rotationPlans.get(keyId);
    if (!plan) {
      throw new Error(`No rotation plan found for key ${keyId}`);
    }

    plan.rotationCompleted = new Date();
    this.rotationPlans.set(keyId, plan);

    console.log(`Key rotation completed for key ${keyId}`);
  }
}

// Export singleton instance
export const keyRotationManager = new KeyRotationManager();

/**
 * Validates the encryption configuration on startup.
 */
export function validateEncryptionConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const encryption = getEncryption();
    // Test encryption/decryption
    const testData = 'test-encryption-data';
    encryption.encrypt(testData).then(encrypted => {
      return encryption.decrypt(encrypted);
    }).then(decrypted => {
      if (decrypted !== testData) {
        errors.push('Encryption test failed: data corruption detected');
      }
    }).catch(error => {
      errors.push(`Encryption test failed: ${error.message}`);
    });
  } catch (error) {
    errors.push(`Encryption initialization failed: ${error}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}