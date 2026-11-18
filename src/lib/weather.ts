import { SeasonTag } from "@/lib/types";

/**
 * Weather context for recommendations. Built from a forecast lookup (see
 * /api/weather) or from the shopper tapping how it feels outside when they
 * don't share their location. Only this summary is ever stored or sent to
 * the AI — never coordinates.
 */

export type WeatherBand = "cold" | "cool" | "mild" | "warm" | "hot";

export interface WeatherContext {
  city: string | null;
  tempC: number;
  feelsLikeC: number;
  /** The single temperature outfits are filtered against (blend of now and today's average). */
  effectiveC: number;
  band: WeatherBand;
  season: Exclude<SeasonTag, "All Season">;
  conditions: string;
  rain: boolean;
  snow: boolean;
  /** Next few days: "Sat: 18°C, partly cloudy". */
  forecast: { label: string; highC: number; lowC: number; conditions: string; rain: boolean }[];
  /** Typical temperature across the coming Saturday/Sunday, for "weekend" requests. */
  weekend: { tempC: number; summary: string } | null;
  source: "location" | "manual";
  fetchedAt: string;
}

export function bandFromTemp(c: number): WeatherBand {
  if (c < 6) return "cold";
  if (c < 14) return "cool";
  if (c < 21) return "mild";
  if (c < 28) return "warm";
  return "hot";
}

export function seasonFromTemp(c: number): WeatherContext["season"] {
  if (c < 6) return "Winter";
  if (c < 14) return "Fall";
  if (c < 21) return "Spring";
  return "Summer";
}

export const cToF = (c: number) => Math.round((c * 9) / 5 + 32);
export const fmtTemp = (c: number) => `${Math.round(c)}°C (${cToF(c)}°F)`;

/** WMO weather codes (Open-Meteo) → readable text. */
export function describeWeatherCode(code: number): { text: string; rain: boolean; snow: boolean } {
  if (code === 0) return { text: "clear", rain: false, snow: false };
  if (code <= 2) return { text: "partly cloudy", rain: false, snow: false };
  if (code === 3) return { text: "overcast", rain: false, snow: false };
  if (code === 45 || code === 48) return { text: "foggy", rain: false, snow: false };
  if (code >= 51 && code <= 57) return { text: "drizzle", rain: true, snow: false };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { text: "rain", rain: true, snow: false };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { text: "snow", rain: false, snow: true };
  if (code >= 95) return { text: "thunderstorms", rain: true, snow: false };
  return { text: "mixed conditions", rain: false, snow: false };
}

/** What the shopper can tap when they won't share their location. */
export const MANUAL_WEATHER_OPTIONS: { label: string; tempC: number }[] = [
  { label: "Hot · 30°C+ / 86°F+", tempC: 32 },
  { label: "Warm · 22–29°C / 72–84°F", tempC: 25 },
  { label: "Mild · 14–21°C / 57–70°F", tempC: 17 },
  { label: "Cool · 6–13°C / 43–55°F", tempC: 9 },
  { label: "Cold · under 6°C / 43°F", tempC: 0 },
];

/** One compact block the stylist sees each turn. */
export function weatherPromptBlock(w: WeatherContext | null, locationShared: boolean): string {
  if (!w) {
    return locationShared
      ? "\n\nWeather: unknown right now."
      : "\n\nWeather: unknown — the shopper hasn't shared their location. If they want a look for today/this weekend/'now' or give no destination or season, ask what the weather is like (use quickReplies) before calling find_outfits.";
  }
  const lines = [
    `\n\nCurrent weather for the shopper${w.city ? ` in ${w.city}` : ""} (${w.source === "location" ? "from their location" : "as they told us"}): ${fmtTemp(w.tempC)}, feels like ${fmtTemp(w.feelsLikeC)}, ${w.conditions}. Dress temperature: ${Math.round(w.effectiveC)}°C → ${w.band}, ${w.season} look.`,
  ];
  if (w.forecast.length) {
    lines.push("Forecast: " + w.forecast.slice(0, 4).map((d) => `${d.label} ${Math.round(d.lowC)}–${Math.round(d.highC)}°C ${d.conditions}`).join("; ") + ".");
  }
  if (w.weekend) lines.push(`Weekend looks like: ${w.weekend.summary} (about ${Math.round(w.weekend.tempC)}°C) — use this temperature for "weekend" requests.`);
  lines.push(
    "Use this weather for any look meant for now/today/this weekend, or whenever no other destination/season is given: pass temperatureC (the dress temperature above, or the weekend one) to find_outfits. If the user names a trip or place, use that destination's expected weather instead. Mention the weather briefly and naturally (e.g. 'it's 4°C and raining, so…'), and favor a layer or rain-ready piece when it's wet."
  );
  return lines.join("\n");
}
