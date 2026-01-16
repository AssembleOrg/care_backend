import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || 'unknown';
}

export function checkRateLimit(
  request: NextRequest,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    // Create new entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(ip, newEntry);
    return { allowed: true, remaining: maxAttempts - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  rateLimitStore.set(ip, entry);
  return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.resetAt };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000); // Cleanup every minute
