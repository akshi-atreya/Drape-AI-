export const metadata = {
  title: "About — Drape",
  description: "Who built Drape.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto w-full px-6 md:px-10 py-16 md:py-24">
      <div className="animate-in grid md:grid-cols-[280px_1fr] gap-10 md:gap-14 items-start">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-beige">
          {/* eslint-disable-next-line @next/next/no-img-element -- static founder portrait served from /public, not optimized via next/image config */}
          <img src="/founder.jpg" alt="Akshi Atreya" className="w-full h-full object-cover" />
        </div>

        <div className="space-y-6 pt-1">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray mb-2">Founder</p>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight">Akshi Atreya</h1>
          </div>

          <p className="text-charcoal-soft text-base md:text-lg leading-relaxed">
            Drape is built and designed by Akshi Atreya, pursuing an MS in Management of
            Technology (MOT) at NYU.
          </p>

          <a
            href="https://www.linkedin.com/in/akshi-atreya-33351219b/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft transition-colors"
          >
            <LinkedInIcon />
            Connect on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}
