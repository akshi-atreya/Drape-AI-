"use client";

import { BODY_BUILDS, BodyBuild, TryOnPrefs } from "@/lib/types";

// Simple front-facing silhouettes: [shoulder, waist, hip] half-widths.
const SHAPES: Record<BodyBuild, [number, number, number]> = {
  Slim: [9, 6, 8],
  Average: [11, 8.5, 11],
  Athletic: [14, 8.5, 10.5],
  Curvy: [11, 7.5, 14],
  "Plus-size": [15, 13, 16],
};

function BuildIcon({ build }: { build: BodyBuild }) {
  const [sh, wa, hi] = SHAPES[build];
  const c = 20;
  const d = [
    `M${c - sh} 17`,
    `C${c - sh} 23 ${c - wa} 25 ${c - wa} 31`,
    `C${c - wa} 36 ${c - hi} 38 ${c - hi} 44`,
    `L${c - hi + 3} 66`,
    `L${c + hi - 3} 66`,
    `L${c + hi} 44`,
    `C${c + hi} 38 ${c + wa} 36 ${c + wa} 31`,
    `C${c + wa} 25 ${c + sh} 23 ${c + sh} 17`,
    `Q${c} 12 ${c - sh} 17Z`,
  ].join(" ");
  return (
    <svg viewBox="0 0 40 70" className="w-8 h-14" fill="currentColor" aria-hidden="true">
      <circle cx={c} cy="7" r="5" />
      <path d={d} />
    </svg>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
        active ? "bg-charcoal text-ivory border-charcoal" : "border-beige-dark text-charcoal-soft hover:border-charcoal"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Optional hints for the try-on image. Every control defaults to "match my
 * photo", which tells the model to keep whatever the photo shows. Build and
 * height are only used when the photo doesn't show the whole body.
 */
export function TryOnTuner({
  prefs,
  onChange,
}: {
  prefs: TryOnPrefs;
  onChange: (patch: Partial<TryOnPrefs>) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-sm text-left space-y-4 rounded-2xl bg-white/70 border border-beige-dark/60 p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray mb-2">Style this on</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={prefs.gender === "Women"} onClick={() => onChange({ gender: "Women" })}>Women</Chip>
          <Chip active={prefs.gender === "Men"} onClick={() => onChange({ gender: "Men" })}>Men</Chip>
          <Chip active={prefs.gender === null} onClick={() => onChange({ gender: null })}>Match my photo</Chip>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-gray">Build</p>
        <p className="text-xs text-gray mb-2">Only used if your photo doesn&apos;t show your full body.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ build: null })}
            aria-pressed={prefs.build === null}
            className={`flex flex-col items-center justify-center w-[72px] h-[92px] rounded-xl border text-xs transition-colors ${
              prefs.build === null ? "border-charcoal bg-beige text-charcoal" : "border-beige-dark text-gray hover:border-charcoal"
            }`}
          >
            <span className="text-base mb-1">✓</span>
            Match my photo
          </button>
          {BODY_BUILDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onChange({ build: b })}
              aria-pressed={prefs.build === b}
              className={`flex flex-col items-center justify-center gap-1 w-[72px] h-[92px] rounded-xl border text-xs transition-colors ${
                prefs.build === b ? "border-charcoal bg-beige text-charcoal" : "border-beige-dark text-gray hover:border-charcoal"
              }`}
            >
              <BuildIcon build={b} />
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="tryon-height" className="text-xs uppercase tracking-wide text-gray">
          Height <span className="normal-case">(optional)</span>
        </label>
        <input
          id="tryon-height"
          value={prefs.height}
          maxLength={20}
          onChange={(e) => onChange({ height: e.target.value })}
          placeholder={`e.g. 5'6" or 168 cm`}
          className="mt-1.5 w-full bg-white border border-beige-dark rounded-xl px-4 py-2 text-base md:text-sm outline-none focus:ring-1 focus:ring-charcoal"
        />
      </div>
    </div>
  );
}
