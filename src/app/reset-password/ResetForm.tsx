"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-charcoal-soft">This reset link is incomplete.</p>
        <Link href="/forgot-password" className="text-sm text-charcoal underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-charcoal-soft bg-white border border-beige-dark rounded-xl px-4 py-4">
          Your password has been updated.
        </p>
        <Link
          href="/sign-in"
          className="inline-block bg-charcoal text-ivory rounded-full px-8 py-2.5 text-sm hover:bg-charcoal-soft transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wide text-gray" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white border border-beige-dark rounded-xl px-4 py-2.5 text-base md:text-sm outline-none focus:ring-1 focus:ring-charcoal"
        />
        <p className="text-xs text-gray">At least 8 characters.</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wide text-gray" htmlFor="confirm">
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full bg-white border border-beige-dark rounded-xl px-4 py-2.5 text-base md:text-sm outline-none focus:ring-1 focus:ring-charcoal"
        />
      </div>
      {error && (
        <p className="text-sm text-accent">
          {error}{" "}
          {/link|expired|used/i.test(error) && (
            <Link href="/forgot-password" className="underline">
              Request a new link
            </Link>
          )}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-charcoal text-ivory rounded-full py-2.5 text-sm hover:bg-charcoal-soft transition-colors disabled:opacity-50"
      >
        {loading ? "Saving..." : "Set new password"}
      </button>
    </form>
  );
}
