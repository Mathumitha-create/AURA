import { db, type Article } from "../db";
import { cache as memoryCache } from "../cache/memoryCache";
import type { Provider } from "../models/aggregation";
import { fetchJson } from "../utils/http";

const CACHE_KEY = "provider:news";
const TTL_MS = 5 * 60 * 1000;

export const newsProvider: Provider<Article[]> = {
  name: "news",

  async fetchLatest() {
    const url = process.env.NEWS_PROVIDER_URL;
    if (url) {
      return fetchJson(url);
    }

    return db.get("articles");
  },

  normalize(raw) {
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.articles)
        ? (raw as any).articles
        : [];

    return list.map((item: any, index: number): Article => ({
      id: String(item.id ?? `news-${index}-${Date.now()}`),
      title: String(item.title ?? "Untitled energy intelligence item"),
      source: String(item.source ?? item.author ?? "AURA Provider"),
      publishedAt: String(item.publishedAt ?? item.published_at ?? new Date().toISOString()),
      content: String(item.content ?? item.description ?? item.summary ?? ""),
      analyzed: Boolean(item.analyzed ?? item.analysis),
      analysis: item.analysis
    }));
  },

  cache(data) {
    memoryCache.set(CACHE_KEY, data, TTL_MS);
  }
};

export function getCachedNews() {
  return memoryCache.get<Article[]>(CACHE_KEY) ?? memoryCache.getStale<Article[]>(CACHE_KEY) ?? db.get("articles");
}
