import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional().default(''),
  DIRECT_URL: z.string().optional().default(''),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional().default(''),
  CLERK_SECRET_KEY: z.string().optional().default(''),
  TRIGGER_PROJECT_REF: z.string().optional().default(''),
  TRIGGER_SECRET_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  TRANSLOADIT_AUTH_KEY: z.string().optional().default(''),
  TRANSLOADIT_AUTH_SECRET: z.string().optional().default(''),
  TRANSLOADIT_TEMPLATE_IMAGE: z.string().optional().default(''),
  TRANSLOADIT_TEMPLATE_VIDEO: z.string().optional().default(''),
});

let validatedEnv: z.infer<typeof envSchema>;

export function validateEnv(): z.infer<typeof envSchema> {
  if (validatedEnv) return validatedEnv;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues.map((i: any) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    console.warn(`[ENV] Validation warnings:\n${errors}`);
    validatedEnv = process.env as any;
    return validatedEnv;
  }
  validatedEnv = result.data;
  return validatedEnv;
}

export function getEnv() {
  return validateEnv();
}

if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (e) {
    console.warn('[ENV] Validation warning:', e);
  }
}
