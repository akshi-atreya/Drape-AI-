/**
 * Reads the public RSS feeds that fashion publications provide for
 * syndication. We only ever keep headline, a short publisher-written
 * description, date and link — never article bodies — and everything we show
 * links back to the original. (Scraping article pages is deliberately not
 * done: it's against these sites' terms and they bot-block it anyway.)
 */

export interface FeedSource {
  outlet: string;
  url: string;
}

export const FEEDS: FeedSource[] = [
  { outlet: "Vogue", url: "https://www.vogue.com/feed/rss" },
  { outlet: "Harper's Bazaar", url: "https://www.harpersbazaar.com/rss/fashion.xml/" },
  { outlet: "Elle", url: "https://www.elle.com/rss/fashion.xml/" },
  { outlet: "WWD", url: "https://wwd.com/feed/" },
  { outlet: "Fashionista", url: "https://fashionista.com/.rss/excerpt/" },
  { outlet: "Who What Wear", url: "https://www.whowhatwear.com/rss" },
  { outlet: "Refinery29", url: "https://www.refinery29.com/en-us/fashion/rss.xml" },
];

export interface FeedItem {
  outlet: string;
  title: string;
  summary: string;
  url: string;
  /** ISO timestamp. */
  published: string;
  categories: string[];
}

const USER_AGENT = "FitCast/1.0 (fashion trend reader; RSS)";
const TIMEOUT_MS = 10_000;
const MAX_FEED_BYTES = 900_000; // Who What Wear's feed alone is ~3 MB; the newest items are first.
const PER_FEED_LIMIT = 20;
const MAX_AGE_DAYS = 30;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function clean(raw: string | undefined): string {
  if (!raw) return "";
  const noCdata = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return decode(decode(noCdata).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function tag(item: string, name: string): string | undefined {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(item);
  return m?.[1];
}

/** Reads at most `max` bytes — enough for the newest items without pulling multi-MB feeds whole. */
async function readUpTo(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < max) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder().decode(buf);
}

// Fashion publications also cover beauty, celebrity gossip, politics, etc. Keep
// the clothing-relevant items.
const OFF_TOPIC = /beauty|wellness|horoscope|politic|entertainment|food|home|travel|royal|health|fitness|relationship|sex|book|movie|tv\b|music/i;
const FASHION_HINT = /fashion|style|wear|outfit|coat|jacket|dress|boot|bag|shoe|trend|runway|collection|denim|knit|sweater|jeans|skirt|trouser|color|colour|jewel|sneaker|loafer|suit|blazer|scarf|hat|handbag/i;

function isRelevant(item: FeedItem): boolean {
  const cats = item.categories.join(" ");
  if (OFF_TOPIC.test(cats) && !FASHION_HINT.test(item.title)) return false;
  return FASHION_HINT.test(`${item.title} ${item.summary} ${cats}`);
}

async function fetchFeed(feed: FeedSource): Promise<FeedItem[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store", // we cache the *result* of the whole pipeline instead
  });
  if (!res.ok) throw new Error(`${feed.outlet} feed returned ${res.status}`);

  const xml = await readUpTo(res, MAX_FEED_BYTES);
  const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
  const items: FeedItem[] = [];

  for (const m of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)) {
    const body = m[1];
    const title = clean(tag(body, "title"));
    const url = clean(tag(body, "link")) || clean(/<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(body)?.[1]);
    const when = Date.parse(clean(tag(body, "pubDate")) || clean(tag(body, "dc:date")));
    if (!title || !/^https:\/\//.test(url) || Number.isNaN(when) || when < cutoff) continue;
    const categories = [...body.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((c) => clean(c[1])).filter(Boolean);
    const summary = clean(tag(body, "description")).slice(0, 280);
    const item: FeedItem = { outlet: feed.outlet, title, summary, url, published: new Date(when).toISOString(), categories };
    if (isRelevant(item)) items.push(item);
    if (items.length >= PER_FEED_LIMIT) break;
  }
  return items;
}

/** Fetches every feed in parallel; a dead feed is skipped rather than failing the lot. */
export async function fetchFeedItems(): Promise<FeedItem[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const seen = new Set<string>();
  const all: FeedItem[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.warn(`Trend feed skipped (${FEEDS[i].outlet}):`, r.reason instanceof Error ? r.reason.message : r.reason);
      return;
    }
    for (const it of r.value) {
      if (seen.has(it.url)) continue;
      seen.add(it.url);
      all.push(it);
    }
  });
  return all.sort((a, b) => b.published.localeCompare(a.published));
}
