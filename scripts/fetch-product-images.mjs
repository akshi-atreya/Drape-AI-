// Populates each product's imageUrl with a real, representative stock photo
// from Pexels — searched by color + garment type (e.g. "burgundy midi
// dress"), not a lookup of the exact SKU (which doesn't exist — this is a
// mock catalog). Run with:
//   node --env-file=.env.local scripts/fetch-product-images.mjs
//
// Requires PEXELS_API_KEY in .env.local (get one free, instantly, at
// https://www.pexels.com/api/). Caches by query so ~274 products only cost
// as many Pexels calls as there are distinct color+subcategory pairs
// (comfortably under the free tier's 200 requests/hour).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_PATH = join(__dirname, "..", "src", "data", "products.json");

const apiKey = process.env.PEXELS_API_KEY;
if (!apiKey) {
  console.error(
    "PEXELS_API_KEY is not set. Add it to .env.local (get a free key instantly at https://www.pexels.com/api/), then run:\n" +
      "  node --env-file=.env.local scripts/fetch-product-images.mjs"
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMITED");
    throw new Error(`Pexels error ${res.status}`);
  }
  const data = await res.json();
  return data.photos?.[0]?.src?.large ?? null;
}

/** Query cache so products sharing a color+subcategory only cost one call. */
const cache = new Map();

async function getImageUrl(product) {
  const primaryQuery = `${product.primaryColor} ${product.subcategory}`.toLowerCase();
  const fallbackQuery = product.subcategory.toLowerCase();

  for (const query of [primaryQuery, fallbackQuery]) {
    if (cache.has(query)) {
      const cached = cache.get(query);
      if (cached) return cached;
      continue; // this query returned nothing before; try the next fallback
    }
    try {
      const url = await searchPexels(query);
      cache.set(query, url);
      await sleep(120); // stay well under the free-tier rate limit
      if (url) return url;
    } catch (err) {
      if (err.message === "RATE_LIMITED") {
        console.warn("Rate limited — waiting 60s...");
        await sleep(60_000);
        return getImageUrl(product); // retry this product after the cool-down
      }
      console.warn(`  ! ${query}: ${err.message}`);
      cache.set(query, null);
    }
  }
  return null;
}

async function main() {
  const products = JSON.parse(readFileSync(PRODUCTS_PATH, "utf-8"));
  let filled = 0;
  let missed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const url = await getImageUrl(p);
    p.imageUrl = url;
    if (url) filled++;
    else missed++;
    if ((i + 1) % 25 === 0 || i === products.length - 1) {
      console.log(`  ${i + 1}/${products.length} processed (${filled} filled, ${missed} missed so far)`);
    }
  }

  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2));
  console.log(`\nDone. ${filled}/${products.length} products got a real photo, ${missed} fell back to the generated swatch.`);
}

main();
