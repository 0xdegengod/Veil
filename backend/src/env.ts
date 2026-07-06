import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(8787),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32),
  SIWE_DOMAIN: z.string().default('localhost:5173'),
  SIWE_URI: z.string().url().default('http://localhost:5173'),
  CHAIN_ID: z.coerce.number().default(11155111),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
