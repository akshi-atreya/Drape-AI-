import { NewsArticle } from "@/lib/types";
import { seedNews } from "@/data/news";

/**
 * Fashion news abstraction. MVP returns curated seed data; in production
 * replace the body of this function with a call to a live web/news API
 * (plus an LLM summarization pass over the fetched articles) — nothing else
 * in the app needs to change since consumers only depend on NewsArticle[].
 */
export async function getFashionNews(): Promise<NewsArticle[]> {
  return seedNews;
}
