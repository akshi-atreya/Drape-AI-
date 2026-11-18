import { createHash, randomBytes } from "node:crypto";
import { ensureSchema, sql } from "@/lib/db";
import { getUserByEmail, updatePassword } from "@/lib/users";

const TOKEN_TTL_MINUTES = 60;
const MIN_SECONDS_BETWEEN_REQUESTS = 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a one-time reset token for the account with this email.
 * Returns null when there is no such account — or when a link was requested
 * for it under a minute ago (a simple brake on spamming someone's inbox).
 * Callers must respond identically either way so the form can't be used to
 * discover which emails have accounts.
 */
export async function createPasswordResetToken(email: string): Promise<{ token: string; email: string } | null> {
  await ensureSchema();
  const user = await getUserByEmail(email);
  if (!user) return null;

  const { rows } = await sql<{ recent: string }>`
    SELECT COUNT(*) AS recent FROM password_resets
    WHERE user_id = ${user.id} AND created_at > now() - make_interval(secs => ${MIN_SECONDS_BETWEEN_REQUESTS})
  `;
  if (Number(rows[0]?.recent ?? 0) > 0) return null;

  const token = randomBytes(32).toString("base64url");
  await sql`
    INSERT INTO password_resets (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${user.id}, now() + make_interval(mins => ${TOKEN_TTL_MINUTES}))
  `;
  return { token, email: user.email };
}

/** Sets the new password if the token is valid, unused and unexpired. The token can be used once. */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  await ensureSchema();
  // Single atomic statement: marking it used is what proves it was valid, so
  // two simultaneous attempts with the same token can't both succeed.
  const { rows } = await sql<{ user_id: string }>`
    UPDATE password_resets SET used_at = now()
    WHERE token_hash = ${hashToken(token)} AND used_at IS NULL AND expires_at > now()
    RETURNING user_id
  `;
  const userId = rows[0]?.user_id;
  if (!userId) return false;

  await updatePassword(userId, newPassword);
  // Any other outstanding links for this account are now void.
  await sql`UPDATE password_resets SET used_at = now() WHERE user_id = ${userId} AND used_at IS NULL`;
  return true;
}
