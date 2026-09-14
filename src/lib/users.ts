import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

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

export function getUserByEmail(email: string): User | undefined {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as User | undefined;
}

export function createUser(input: { email: string; password: string; name?: string | null }): PublicUser {
  const email = input.email.trim().toLowerCase();
  const id = randomUUID();
  const hashedPassword = bcrypt.hashSync(input.password, SALT_ROUNDS);
  const createdAt = new Date().toISOString();

  db.prepare(
    "INSERT INTO users (id, email, name, hashedPassword, createdAt) VALUES (?, ?, ?, ?, ?)"
  ).run(id, email, input.name ?? null, hashedPassword, createdAt);

  return { id, email, name: input.name ?? null };
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.hashedPassword);
}

export function countUsers(): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  return row.count;
}
