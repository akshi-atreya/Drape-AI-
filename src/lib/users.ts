import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { ensureSchema, sql } from "@/lib/db";
import { localCount, localFindByEmail, localInsert, localStoreEnabled } from "@/lib/local-users";

export interface User {
  id: string;
  email: string;
  name: string | null;
  hashedPassword: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

const SALT_ROUNDS = 10;

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  hashed_password: string;
  created_at: string;
}

function fromRow(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, hashedPassword: row.hashed_password, createdAt: row.created_at };
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (localStoreEnabled()) {
    const row = await localFindByEmail(email.trim().toLowerCase());
    return row ? fromRow(row) : undefined;
  }
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT * FROM users WHERE email = ${email.trim().toLowerCase()}
  `;
  return rows[0] ? fromRow(rows[0]) : undefined;
}

export async function createUser(input: { email: string; password: string; name?: string | null }): Promise<PublicUser> {
  if (!localStoreEnabled()) await ensureSchema();
  const email = input.email.trim().toLowerCase();
  const id = randomUUID();
  const hashedPassword = bcrypt.hashSync(input.password, SALT_ROUNDS);

  if (localStoreEnabled()) {
    await localInsert({ id, email, name: input.name ?? null, hashed_password: hashedPassword, created_at: new Date().toISOString() });
    return { id, email, name: input.name ?? null };
  }

  await sql`
    INSERT INTO users (id, email, name, hashed_password)
    VALUES (${id}, ${email}, ${input.name ?? null}, ${hashedPassword})
  `;

  return { id, email, name: input.name ?? null };
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.hashedPassword);
}

export async function countUsers(): Promise<number> {
  if (localStoreEnabled()) return localCount();
  await ensureSchema();
  const { rows } = await sql<{ count: string }>`SELECT COUNT(*) as count FROM users`;
  return Number(rows[0]?.count ?? 0);
}
