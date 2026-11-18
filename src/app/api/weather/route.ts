import { NextRequest, NextResponse } from "next/server";
import { bandFromTemp, describeWeatherCode, seasonFromTemp, WeatherContext } from "@/lib/weather";

export const runtime = "nodejs";

/**
 * Turns coordinates into a weather summary for the stylist. Coordinates are
 * used for these two lookups only — they are not logged or stored, and the
 * summary returned contains no location more precise than a city name.
 *
 * Weather: Open-Meteo (free, no key). City name: BigDataCloud's free
 * client reverse-geocoder (no key); if it fails we just omit the city.
 */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface OpenMeteo {
  current?: { temperature_2m: number; apparent_temperature: number; weather_code: number };
  daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[] };
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Invalid location." }, { status: 400 });
  }
  // ~1km precision is plenty for weather and avoids handling exact positions.
  const la = lat.toFixed(2);
  const lo = lon.toFixed(2);

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}` +
    `&current=temperature_2m,apparent_temperature,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=7&timezone=auto`;
  const cityUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${la}&longitude=${lo}&localityLanguage=en`;

  const [forecastRes, cityRes] = await Promise.allSettled([
    fetch(forecastUrl, { signal: AbortSignal.timeout(6000), cache: "no-store" }),
    fetch(cityUrl, { signal: AbortSignal.timeout(4000), cache: "no-store" }),
  ]);

  if (forecastRes.status !== "fulfilled" || !forecastRes.value.ok) {
    return NextResponse.json({ error: "Couldn't get the weather right now." }, { status: 502 });
  }
  const data = (await forecastRes.value.json()) as OpenMeteo;
  const cur = data.current;
  const daily = data.daily;
  if (!cur || !daily?.time?.length) {
    return NextResponse.json({ error: "Couldn't get the weather right now." }, { status: 502 });
  }

  let city: string | null = null;
  if (cityRes.status === "fulfilled" && cityRes.value.ok) {
    const c = (await cityRes.value.json().catch(() => ({}))) as { city?: string; locality?: string };
    city = (c.city || c.locality || "").trim() || null;
  }

  const days = daily.time.map((date, i) => {
    const d = new Date(`${date}T12:00:00`);
    const desc = describeWeatherCode(daily.weather_code[i]);
    return {
      date,
      dow: d.getDay(),
      label: i === 0 ? "Today" : DAYS[d.getDay()],
      highC: daily.temperature_2m_max[i],
      lowC: daily.temperature_2m_min[i],
      conditions: desc.text,
      rain: desc.rain || desc.snow,
    };
  });

  // What you'd actually dress for: mostly how today is on average, tempered by how it feels right now.
  const todayMean = (days[0].highC + days[0].lowC) / 2;
  const effectiveC = Math.round((0.4 * cur.apparent_temperature + 0.6 * todayMean) * 10) / 10;
  const now = describeWeatherCode(cur.weather_code);

  // The coming Saturday/Sunday (or today, if it's already the weekend).
  const wk = days.filter((d) => d.dow === 6 || d.dow === 0).slice(0, 2);
  const weekend =
    wk.length > 0
      ? {
          tempC: Math.round((wk.reduce((a, d) => a + (d.highC + d.lowC) / 2, 0) / wk.length) * 10) / 10,
          summary: wk.map((d) => `${d.label === "Today" ? "Today" : d.label} ${Math.round(d.lowC)}–${Math.round(d.highC)}°C, ${d.conditions}`).join("; "),
        }
      : null;

  const body: WeatherContext = {
    city,
    tempC: Math.round(cur.temperature_2m * 10) / 10,
    feelsLikeC: Math.round(cur.apparent_temperature * 10) / 10,
    effectiveC,
    band: bandFromTemp(effectiveC),
    season: seasonFromTemp(effectiveC),
    conditions: now.text,
    rain: now.rain || days[0].rain,
    snow: now.snow,
    forecast: days.slice(0, 5).map(({ label, highC, lowC, conditions, rain }) => ({ label, highC, lowC, conditions, rain })),
    weekend,
    source: "location",
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(body);
}
