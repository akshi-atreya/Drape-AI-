/**
 * Minimal transactional email via Resend's HTTP API (no SDK needed).
 *
 * Setup: create a Resend account, verify your sending domain (it gives you
 * DNS records to add), then set RESEND_API_KEY and EMAIL_FROM. In development,
 * with no key set, the message is printed to the server console instead so
 * the flow can be tested without sending anything.
 */

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(msg: OutgoingEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email — dev only, not sent]\nTo: ${msg.to}\nSubject: ${msg.subject}\n\n${msg.text}\n`);
      return;
    }
    throw new Error("RESEND_API_KEY is not set — cannot send email.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "FitCast AI <onboarding@resend.dev>",
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Email provider returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

export function passwordResetEmail(resetUrl: string): Omit<OutgoingEmail, "to"> {
  const text = `Someone asked to reset the password for your FitCast AI account.

Reset it here (the link works once and expires in 1 hour):
${resetUrl}

If that wasn't you, ignore this email — your password won't change.`;
  const html = `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px;color:#232220">
<h2 style="font-weight:normal">Reset your password</h2>
<p style="font-family:Arial,sans-serif;line-height:1.5">Someone asked to reset the password for your FitCast AI account. The link works once and expires in 1 hour.</p>
<p><a href="${resetUrl}" style="display:inline-block;background:#232220;color:#faf7f2;padding:12px 24px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif">Choose a new password</a></p>
<p style="font-family:Arial,sans-serif;font-size:13px;color:#777">If that wasn't you, ignore this email — your password won't change.</p></div>`;
  return { subject: "Reset your FitCast AI password", text, html };
}
