"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AUTH_DISABLED } from "@/lib/auth-mode";

// Phone-only bottom navigation. The top nav links are hidden below `md`
// (they don't fit), so without this a phone user couldn't reach anything
// but the home screen. Only shown to signed-in users — the signed-out
// pages (sign-in, sign-up, about) have nowhere else to go.
const TABS = [
  { href: "/", label: "Discover", icon: SparkIcon },
  { href: "/trends", label: "Trends", icon: TrendIcon },
  { href: "/wardrobe", label: "Wardrobe", icon: HangerIcon },
  { href: "/saved", label: "Saved", icon: HeartIcon },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { status } = useSession();
  if (!AUTH_DISABLED && status !== "authenticated") return null;

  return (
    <>
      {/* In-flow spacer so the footer/last content never hides behind the fixed bar. */}
      <div aria-hidden className="md:hidden h-[calc(3.5rem+env(safe-area-inset-bottom))]" />
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ivory/95 backdrop-blur-sm border-t border-beige-dark/60 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 h-14 text-[11px] transition-colors ${
                  active ? "text-charcoal" : "text-gray"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      <path d="M19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z" />
    </svg>
  );
}
function TrendIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}
function HangerIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 8a2 2 0 1 0-2-2" />
      <path d="M12 8v2l8.5 5.5a1 1 0 0 1-.55 1.8H4.05a1 1 0 0 1-.55-1.8L12 10" />
    </svg>
  );
}
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  );
}
