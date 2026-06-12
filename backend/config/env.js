require('dotenv').config();

const { z } = require('zod');

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (postgresql://user:pass@host:5432/db)'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters — generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'),
  GEMINI_API_KEY: z.string().optional(), // Gemini не фатален — транзакции сохраняются без ai_response
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'), // у gemini-2.0-flash нулевая free-tier квота
  HTTPS_PROXY: z.string().optional(), // прокси для Gemini в регионах, где Google API заблокирован
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

module.exports = parsed.data;
