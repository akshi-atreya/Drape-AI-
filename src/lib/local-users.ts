import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * A tiny file-backed user store for LOCAL testing only, so sign-up, sign-in and
 * sign-out can be exercised end to end without a database.
 *
 * It is used only when ALL of these hold: not running on Vercel, no Postgres
 * connection string is configured, and either this is a dev server or
 * LOCAL_USER_STORE=true is set (to test a production build locally). On
 * Vercel there is always a database, so this never runs in production.
 */

export interface LocalUserRow {
  id: string;
  email: string;
  name: string | null;
  hashed_password: string;
  created_at: string;
}

const FILE = path.join(process.cwd(), ".data", "dev-users.json");
const DB_VARS = ["POSTGRES_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"];

export function localStoreEnabled(): boolean {
  if (process.env.VERCEL) return false;
  if (DB_VARS.some((v) => process.env[v])) return false;
  return process.env.NODE_ENV !== "production" || process.env.LOCAL_USER_STORE === "true";
}

async function read(): Promise<LocalUserRow[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf-8")) as LocalUserRow[];
  } catch {
    return [];
  }
}

export async function localFindByEmail(email: string): Promise<LocalUserRow | undefined> {
  return (await read()).find((u) => u.email === email);
}

export async function localInsert(row: LocalUserRow): Promise<void> {
  const rows = await read();
  if (rows.some((u) => u.email === row.email)) {
    // Same shape as a Postgres unique violation, which the sign-up route already handles.
    throw Object.assign(new Error("duplicate key value violates unique constraint"), { code: "23505" });
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify([...rows, row], null, 2));
}

export async function localCount(): Promise<number> {
  return (await read()).length;
}
