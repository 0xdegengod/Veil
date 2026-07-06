import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { env } from '../src/env.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: tsx scripts/apply-sql-migration.ts <path-to.sql>')
    process.exit(1)
  }

  const sql = readFileSync(join(__dirname, '..', file), 'utf8')
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL })

  try {
    await pool.query(sql)
    console.log(`Applied migration: ${file}`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
