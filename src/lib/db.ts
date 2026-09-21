import { createPool, type VercelPool } from "@vercel/postgres";

/**
 * Hosted Postgres user store (Neon, via Vercel's storage marketplace).
 * Every sign-up is a real, persisted row — the previous local SQLite file
 * (data/app.db) didn't survive Vercel's serverless functions, whose
 * filesystem is read-only outside /tmp and reset on every deploy anyway.
 *
 * Set up: in the Vercel dashboard, Project -> Storage -> Browse Storage ->
 * Neon ("Serverless Postgres"), then connect it to this project. That
 * auto-injects a connection string env var for production — the exact name
 * varies (POSTGRES_URL for the legacy native integration, DATABASE_URL for
 * the newer Neon marketplace one), so this resolves whichever is present
 * rather than assuming one. For local dev, run `vercel link` once, then
 * `vercel env pull .env.local` to pull the same value down — no secret
 * ever needs to be typed into a prompt or file by hand.
 */

const CONNECTION_STRING_ENV_VARS = ["POSTGRES_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"];

function resolveConnectionString(): string {
  for (const name of CONNECTION_STRING_ENV_VARS) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(
    `No database connection string found. Set one of ${CONNECTION_STRING_ENV_VARS.join(", ")} — ` +
      "in Vercel: Project -> Storage -> connect a Postgres database. Locally: `vercel env pull .env.local`."
  );
}

let pool: VercelPool | null = null;

function getPool(): VercelPool {
  if (!pool) pool = createPool({ connectionString: resolveConnectionString() });
  return pool;
}

let schemaReady: Promise<void> | null = null;

/** Idempotent — safe to call before every query; cheap after the first. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          hashed_password TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `
      .then(() => undefined);
  }
  return schemaReady;
}

/** Tagged-template query helper — use like sql`SELECT ...`. */
export const sql: VercelPool["sql"] = (...args) => getPool().sql(...args);
