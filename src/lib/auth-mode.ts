/**
 * Local-testing switch: set NEXT_PUBLIC_DISABLE_AUTH=true in .env.local to
 * skip sign-in entirely while developing (no database needed).
 *
 * It is ignored in production builds — NODE_ENV is "production" on Vercel and
 * for `next build`/`next start` — so it cannot open up a deployed site even
 * if the variable is set there by mistake. Remove the line (or set it to
 * anything else) to restore the normal sign-in requirement.
 */
export const AUTH_DISABLED =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";
