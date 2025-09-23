import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

/**
 * Gets encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  if (key.length !== 64) { // 32 bytes = 64 hex chars
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a string value using AES-256-GCM
 */
export function encryptField(plaintext: string): EncryptedData {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty value');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from('deelrx-crm')); // Additional authenticated data
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  };
}

/**
 * Decrypts an encrypted value
 */
export function decryptField(encryptedData: EncryptedData): string {
  if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.tag) {
    throw new Error('Invalid encrypted data structure');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const tag = Buffer.from(encryptedData.tag, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from('deelrx-crm'));
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generates a new encryption key (for key rotation)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Database column encryption helpers
 */
export const encryptedColumns = {
  // Customer PII
  'customers.email': true,
  'customers.phone': true,
  'customers.address': true,
  'customers.tax_id': true,
  
  // Credit details
  'credit_accounts.account_number': true,
  'credit_accounts.routing_number': true,
  
  // Payment information
  'payment_methods.account_number': true,
  'payment_methods.routing_number': true,
  
  // User PII
  'users.email': true,
  'users.phone': true,
} as const;

/**
 * Helper to encrypt object fields that need encryption
 */
export function encryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  tableName: string
): T {
  const encrypted = { ...data } as any;
  
  Object.keys(data).forEach(field => {
    const columnKey = `${tableName}.${field}` as keyof typeof encryptedColumns;
    if (encryptedColumns[columnKey] && data[field]) {
      encrypted[field] = encryptField(String(data[field]));
    }
  });
  
  return encrypted;
}

/**
 * Helper to decrypt object fields that were encrypted
 */
export function decryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  tableName: string
): T {
  const decrypted = { ...data } as any;
  
  Object.keys(data).forEach(field => {
    const columnKey = `${tableName}.${field}` as keyof typeof encryptedColumns;
    if (encryptedColumns[columnKey] && data[field] && typeof data[field] === 'object') {
      try {
        decrypted[field] = decryptField(data[field] as EncryptedData);
      } catch (error) {
        console.error(`Failed to decrypt ${tableName}.${field}:`, error);
        // Return encrypted data if decryption fails
        decrypted[field] = '[ENCRYPTED]';
      }
    }
  });
  
  return decrypted;
}

/**
 * Key rotation utilities
 */
export function shouldRotateKey(): boolean {
  const rotationDate = process.env.ENCRYPTION_KEY_ROTATION_DATE;
  if (!rotationDate) return false;
  
  const rotationTimestamp = new Date(rotationDate).getTime();
  const now = Date.now();
  const daysSinceRotation = (now - rotationTimestamp) / (1000 * 60 * 60 * 24);
  
  // Rotate key every 90 days
  return daysSinceRotation > 90;
}

export type { EncryptedData };