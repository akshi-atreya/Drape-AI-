import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Pulls the product photo (and title) out of a retailer page the shopper
 * pasted. Strictly best-effort: plenty of retailers sit behind bot
 * protection and will refuse a server-side request, in which case the
 * caller tells the shopper to upload a screenshot/photo instead.
 *
 * Because this fetches an arbitrary user-supplied URL from our server, it
 * is guarded against SSRF: http(s) only, every hop (including redirects)
 * is resolved and rejected if it points at a private/loopback/link-local
 * address, and both the page and the image are size- and time-capped.
 */

const MAX_HTML_BYTES = 3_000_000; // read at most this much HTML; the tags we need are near the top
const MAX_IMAGE_BYTES = 6_000_000;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 4;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export class GarmentFetchError extends Error {}

function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      a >= 224 // multicast/reserved
    );
  }
  if (v === 6) {
    const l = ip.toLowerCase();
    if (l === "::1" || l === "::") return true;
    if (l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe8") || l.startsWith("fe9") || l.startsWith("fea") || l.startsWith("feb")) return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(l);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }
  return true;
}

async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new GarmentFetchError("That doesn't look like a valid link.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new GarmentFetchError("Only http(s) links are supported.");
  }
  if (url.username || url.password) {
    throw new GarmentFetchError("That link can't be used.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new GarmentFetchError("That link can't be used.");
  }
  const addrs = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true }).catch(() => {
        throw new GarmentFetchError("Couldn't find that website.");
      });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
    throw new GarmentFetchError("That link can't be used.");
  }
  return url;
}

async function safeFetch(rawUrl: string, accept: string): Promise<Response> {
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicHttpUrl(current);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "User-Agent": BROWSER_UA, Accept: accept, "Accept-Language": "en-US,en;q=0.9" },
      });
    } catch {
      throw new GarmentFetchError("That site didn't respond in time.");
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new GarmentFetchError("That link redirected somewhere we couldn't follow.");
      current = new URL(loc, url).toString();
      continue;
    }
    return res;
  }
  throw new GarmentFetchError("That link redirected too many times.");
}

/** Reads up to maxBytes and stops quietly (no error) — for HTML, where the head is all we need. */
async function readUpTo(res: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) throw new GarmentFetchError("Empty response.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function readCapped(res: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) throw new GarmentFetchError("Empty response.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new GarmentFetchError("That file is too large.");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function metaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, "i");
    const m = re1.exec(html) ?? re2.exec(html);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

/** Product image from schema.org JSON-LD, which many stores include even when og:image is generic. */
function jsonLdImage(html: string): string | null {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1]);
      const nodes: unknown[] = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];
      for (const node of nodes as Record<string, unknown>[]) {
        const type = node?.["@type"];
        const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
        if (!isProduct) continue;
        const img = node.image as unknown;
        const first = Array.isArray(img) ? img[0] : img;
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && typeof (first as { url?: string }).url === "string") {
          return (first as { url: string }).url;
        }
      }
    } catch {
      // malformed JSON-LD — try the next block
    }
  }
  return null;
}

function pageTitle(html: string): string | null {
  const og = metaContent(html, ["og:title", "twitter:title"]);
  if (og) return og;
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m ? decodeEntities(m[1]).trim() : null;
}

function toDataUrl(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

export interface GarmentFromLink {
  imageDataUrl: string;
  title?: string;
  sourceUrl: string;
}

const TRACKING_PARAM = /^(utm_.+|gclid|gclsrc|gbraid|wbraid|gad_.+|fbclid|msclkid|mc_cid|mc_eid|_ga|igshid|yclid|dclid)$/i;

/** Drops advertising/tracking parameters (they only add noise and can trip bot filters). */
function stripTracking(raw: string): string {
  try {
    const u = new URL(raw);
    for (const key of [...u.searchParams.keys()]) if (TRACKING_PARAM.test(key)) u.searchParams.delete(key);
    return u.toString();
  } catch {
    return raw;
  }
}

/** True for the "you've been blocked" pages stores return instead of the product (often with a 200 status). */
function looksLikeBotWall(html: string): boolean {
  if (/WAF_Denial|px-captcha|cf-challenge|cf-browser-verification|Pardon Our Interruption|Incident Number|Access Denied|Attention Required|verify you are (a )?human|are you a (robot|human)|unusual traffic|request blocked/i.test(html)) {
    return true;
  }
  // A real product page is large and has a title; a tiny page with neither is a wall.
  return html.length < 6000 && !/<title[^>]*>[^<]{3,}/i.test(html);
}

export async function garmentFromLink(rawLink: string): Promise<GarmentFromLink> {
  const link = stripTracking(rawLink);
  const res = await safeFetch(link, "text/html,application/xhtml+xml,image/*;q=0.8,*/*;q=0.5");

  if (res.status === 403 || res.status === 429 || res.status === 401) {
    throw new GarmentFetchError("That store blocked the request.");
  }
  if (!res.ok) throw new GarmentFetchError("Couldn't open that link.");

  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();

  // The link might itself be a direct image URL.
  if (contentType.startsWith("image/")) {
    const bytes = await readCapped(res, MAX_IMAGE_BYTES);
    return { imageDataUrl: toDataUrl(bytes, contentType.split(";")[0]), sourceUrl: link };
  }

  if (!contentType.includes("html")) throw new GarmentFetchError("That link doesn't look like a product page.");

  const html = new TextDecoder().decode(await readUpTo(res, MAX_HTML_BYTES));
  const imageRef =
    metaContent(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]) ?? jsonLdImage(html);
  if (!imageRef) {
    throw new GarmentFetchError(
      looksLikeBotWall(html) ? "That store blocked the request." : "Couldn't find a product photo on that page."
    );
  }

  let imageUrl: string;
  try {
    imageUrl = new URL(imageRef, res.url || link).toString();
  } catch {
    throw new GarmentFetchError("Couldn't find a product photo on that page.");
  }

  const imgRes = await safeFetch(imageUrl, "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8");
  if (!imgRes.ok) throw new GarmentFetchError("Couldn't download the product photo.");
  const imgType = (imgRes.headers.get("content-type") ?? "").split(";")[0].toLowerCase();
  if (!imgType.startsWith("image/")) throw new GarmentFetchError("Couldn't download the product photo.");
  const bytes = await readCapped(imgRes, MAX_IMAGE_BYTES);

  return {
    imageDataUrl: toDataUrl(bytes, imgType),
    title: pageTitle(html) ?? undefined,
    sourceUrl: link,
  };
}
