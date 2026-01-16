import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getEnv } from '@/src/config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM

export class EncryptionService {
  private key: Buffer;

  constructor() {
    const env = getEnv();
    try {
      this.key = Buffer.from(env.ENC_KEY_BASE64, 'base64');
      if (this.key.length !== 32) {
        throw new Error(`ENC_KEY_BASE64 must be 32 bytes when decoded. Got ${this.key.length} bytes. Generate with: openssl rand -base64 32`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid ENC_KEY_BASE64: ${message}. Generate with: openssl rand -base64 32`);
    }
  }

  encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted (all hex)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      return '';
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export const encryptionService = new EncryptionService();
