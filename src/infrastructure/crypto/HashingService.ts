import { createHmac } from 'crypto';
import { getEnv } from '@/src/config/env';

const ALGORITHM = 'sha256';

export class HashingService {
  private pepper: string;

  constructor() {
    const env = getEnv();
    this.pepper = env.HMAC_PEPPER;
  }

  hash(data: string): string {
    if (!data) {
      return '';
    }
    return createHmac(ALGORITHM, this.pepper).update(data).digest('hex');
  }
}

export const hashingService = new HashingService();
