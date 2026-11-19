# FitCast AI — your AI fashion suggestion friend

Chat with an AI stylist about an occasion. FitCast AI designs complete looks
made of piece *types* ("a charcoal blouse, cropped cut") that fit the weather
where you are and what's trending right now, shows one illustrative image of
the look, and then shows the whole outfit on you with virtual try-on.

## How it works

- **Stylist chat** (`src/app/api/chat`, `src/lib/chat-tools.ts`): Claude holds
  the conversation (with tap-to-reply buttons) and calls tools. It never picks
  products itself.
- **Recommendation engine** (`src/lib/recommendation-engine.ts`): deterministic
  scoring over a catalog of garment *types* (occasion/formality, style, color,
  season, and current trends). The catalog (`src/data/products.json`) is internal
  data for ranking; no prices, brands or retailers are shown.
- **Live trends** (`src/lib/trend-sources.ts`, `src/lib/live-trends.ts`): RSS
  headlines from public fashion feeds (Vogue, Harper's Bazaar, Elle, WWD,
  Fashionista, Who What Wear, Refinery29) → Claude extracts trends mapped onto
  our piece types and colors → shown on the Trends page (with links back) and
  used to boost matching pieces. Cached 12h; a daily Vercel Cron
  (`/api/cron/trends`, protected by `CRON_SECRET`) keeps it warm. Only headline,
  publisher snippet and link are used — never article text.
- **Style what you own**: attach a photo of a garment in the chat. Claude (vision)
  identifies it, can ask what else you own (tappable answers), and every look
  is built around it — owned pieces are locked in, the rest are chosen to
  complement its color. The look image and try-on use your actual garment
  photo. Photos are only used to read the item and aren't stored on the server.
- **Weather** (`/api/weather`): the browser shares location (never stored) →
  Open-Meteo forecast → temperature drives which pieces make sense (each piece
  type has a comfort range; coats are required in the cold). If location is
  declined, the stylist asks with tappable options instead.
- **Look image** (`/api/outfit-image`) and **virtual try-on** (`/api/tryon`):
  Gemini image model. Try-on dresses the shopper's photo in the outfit's pieces
  (exact colors and cuts), with optional gender / build / height hints.
- **Auth**: Auth.js credentials + JWT, users in Postgres (Neon via Vercel).

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in the keys
npx next dev --webpack
```

| Variable | Used for |
| --- | --- |
| `ANTHROPIC_API_KEY` | Stylist chat and trend extraction |
| `GEMINI_API_KEY` | Look images and virtual try-on (needs billing enabled) |
| `AUTH_SECRET` | Signing session cookies |
| `POSTGRES_URL` | User accounts (Neon / Vercel Postgres) |
| `CRON_SECRET` | Authorizes the daily trend warm-up cron |
| `NEXT_PUBLIC_DISABLE_AUTH=true` | Local testing only: skip sign-in (ignored in production) |

## Deploying to Vercel

Connect the repo, add the variables above (Production), connect a Postgres
database from Storage, and deploy. `vercel.json` registers the daily cron.

## Layout

```
src/app/          Pages and API routes
src/components/   UI (chat, outfit cards, try-on, trends)
src/lib/          Engine, tools, trend pipeline, image/try-on providers
src/data/         Garment-type catalog, fallback trends
scripts/          Catalog generator (legacy image fetcher is unused)
```

Built by [Akshi Atreya](https://www.linkedin.com/in/akshi-atreya-33351219b/).
