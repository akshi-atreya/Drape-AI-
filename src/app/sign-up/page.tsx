"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong creating your account.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created — sign in to continue.");
        setLoading(false);
        router.push("/sign-in");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
      <div className="animate-in w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            Drape
          </Link>
          <h1 className="font-serif text-3xl mt-6">Create your account</h1>
          <p className="text-charcoal-soft text-sm mt-2">
            Your stylist remembers your taste from here on.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-gray" htmlFor="name">
              Name <span className="text-gray/70 normal-case">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-beige-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-charcoal"
            />
          </div>
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-beige-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-charcoal"
            />
            <p className="text-xs text-gray">At least 8 characters.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-gray" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-beige-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-charcoal"
            />
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-charcoal text-ivory rounded-full py-2.5 text-sm hover:bg-charcoal-soft transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-charcoal underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
