import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ENC_KEY_BASE64: z.string().min(1),
  HMAC_PEPPER: z.string().min(1),
  ADMIN_SESSION_SECRET: z.string().min(1),
  SWAGGER_PASSWORD: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function getEnv(): Env {
  if (!env) {
    env = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      ENC_KEY_BASE64: process.env.ENC_KEY_BASE64,
      HMAC_PEPPER: process.env.HMAC_PEPPER,
      ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
      SWAGGER_PASSWORD: process.env.SWAGGER_PASSWORD,
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
  }
  return env;
}

// Validate on import
getEnv();
