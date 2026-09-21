import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-beige-dark/50 py-6">
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex items-center justify-between text-xs text-gray">
        <span>© {new Date().getFullYear()} Drape</span>
        <Link href="/about" className="hover:text-charcoal transition-colors">
          About
        </Link>
      </div>
    </footer>
  );
}
