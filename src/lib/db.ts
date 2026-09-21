import { sql } from "@vercel/postgres";

/**
 * Hosted Postgres user store (Vercel Postgres, powered by Neon). Every
 * sign-up is a real, persisted row — the previous local SQLite file
 * (data/app.db) didn't survive Vercel's serverless functions, whose
 * filesystem is read-only outside /tmp and reset on every deploy anyway.
 *
 * Set up: in the Vercel dashboard, Project -> Storage -> Create Database ->
 * Postgres. That auto-injects POSTGRES_URL (and related vars) for
 * production. For local dev, run `vercel link` once, then
 * `vercel env pull .env.local` to pull the same connection string down —
 * no secret ever needs to be typed into a prompt or file by hand.
 */

let schemaReady: Promise<void> | null = null;

/** Idempotent — safe to call before every query; cheap after the first. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        hashed_password TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `.then(() => undefined);
  }
  return schemaReady;
}

export { sql };
