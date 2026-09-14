import Database from "better-sqlite3";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

/**
 * Local user store (SQLite via better-sqlite3). This is the MVP's account
 * database — every sign-up is a real, persisted row here, which is also how
 * "how many people are using this" gets answered (see countUsers() in
 * src/lib/users.ts). Swap for a hosted Postgres/etc. later; nothing above
 * this module needs to change since callers only use the functions in
 * users.ts.
 */

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, "app.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    hashedPassword TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

export default db;
