import { Pool } from "pg"

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined
}

function createPool(): Pool {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
  return pool
}

// Singleton: reusar pool entre hot-reloads en desarrollo
const pool = global.pgPool ?? createPool()
if (process.env.NODE_ENV !== "production") global.pgPool = pool

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const result = await pool.query(text, params)
  return { rows: result.rows as T[], rowCount: result.rowCount }
}

export default pool
