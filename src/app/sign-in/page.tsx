"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setUserCount(d.userCount))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("That email and password don't match an account.");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
      <div className="animate-in w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            Drape
          </Link>
          <h1 className="font-serif text-3xl mt-6">Welcome back</h1>
          <p className="text-charcoal-soft text-sm mt-2">Sign in to talk to your stylist.</p>
        </div>

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
              className="w-full bg-white border border-beige-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-charcoal"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-gray" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-beige-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-charcoal"
            />
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-charcoal text-ivory rounded-full py-2.5 text-sm hover:bg-charcoal-soft transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-gray mt-6">
          New here?{" "}
          <Link href="/sign-up" className="text-charcoal underline">
            Create an account
          </Link>
        </p>

        {userCount != null && userCount > 0 && (
          <p className="text-center text-xs text-gray mt-10">
            {userCount.toLocaleString()} {userCount === 1 ? "person has" : "people have"} joined Drape.
          </p>
        )}
      </div>
    </div>
  );
}
