"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
      <div className="animate-in w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            FitCast AI
          </Link>
          <h1 className="font-serif text-3xl mt-6">Forgot your password?</h1>
          <p className="text-charcoal-soft text-sm mt-2">
            Enter your email and we&apos;ll send you a link to choose a new one.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-charcoal-soft leading-relaxed bg-white border border-beige-dark rounded-xl px-4 py-4">
              If an account exists for <span className="text-charcoal">{email}</span>, a reset link is on its way.
              It works once and expires in an hour. Check your spam folder if you don&apos;t see it.
            </p>
            <Link href="/sign-in" className="text-sm text-charcoal underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wide text-gray" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-beige-dark rounded-xl px-4 py-2.5 text-base md:text-sm outline-none focus:ring-1 focus:ring-charcoal"
              />
            </div>
            {error && <p className="text-sm text-accent">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-charcoal text-ivory rounded-full py-2.5 text-sm hover:bg-charcoal-soft transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <p className="text-center text-sm text-gray">
              <Link href="/sign-in" className="text-charcoal underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
