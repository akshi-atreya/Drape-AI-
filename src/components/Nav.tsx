"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useAppStore } from "@/store/useAppStore";

const LINKS = [
  { href: "/", label: "Discover" },
  { href: "/trends", label: "Trends" },
  { href: "/wardrobe", label: "My Wardrobe" },
  { href: "/saved", label: "Saved Looks" },
];

export function Nav() {
  const pathname = usePathname();
  const detectCountry = useAppStore((s) => s.detectCountry);
  const fetchFxRates = useAppStore((s) => s.fetchFxRates);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Region detection only affects which storefront "Shop" links resolve
    // to — safe to run once, no permission prompt (reads navigator.language,
    // not geolocation).
    detectCountry();
    fetchFxRates();
  }, [detectCountry, fetchFxRates]);

  return (
    <header className="sticky top-0 z-30 bg-ivory/90 backdrop-blur-sm border-b border-beige-dark/50">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-10 h-16">
        <Link href="/" className="font-serif text-xl tracking-tight">
          Drape
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`transition-colors ${
                pathname === l.href ? "text-charcoal" : "text-gray hover:text-charcoal"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        {status === "authenticated" ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray truncate max-w-[160px]">
              {session.user?.name || session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              className="text-sm text-gray hover:text-charcoal transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/sign-in" className="text-sm text-gray hover:text-charcoal transition-colors">
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
