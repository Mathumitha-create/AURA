import { cache as memoryCache } from "../cache/memoryCache";
import type { NormalizedCommodity, Provider } from "../models/aggregation";
import { fetchJson } from "../utils/http";

const CACHE_KEY = "provider:commodity";
const TTL_MS = 5 * 60 * 1000;

const fallbackCommodities: NormalizedCommodity[] = [
  {
    symbol: "BRENT",
    name: "Brent Crude",
    unit: "bbl",
    price: 87,
    changePercent: 4.2,
    currency: "USD",
    updatedAt: new Date().toISOString()
  },
  {
    symbol: "WTI",
    name: "WTI Crude",
    unit: "bbl",
    price: 79.8,
    changePercent: 1.6,
    currency: "USD",
    updatedAt: new Date().toISOString()
  },
  {
    symbol: "DUBAI",
    name: "Dubai/Oman Crude",
    unit: "bbl",
    price: 84.1,
    changePercent: 2.4,
    currency: "USD",
    updatedAt: new Date().toISOString()
  }
];

export const commodityProvider: Provider<NormalizedCommodity[]> = {
  name: "commodity",

  async fetchLatest() {
    const url = process.env.COMMODITY_PROVIDER_URL;
    if (url) {
      return fetchJson(url);
    }

    return fallbackCommodities.map(item => ({ ...item, updatedAt: new Date().toISOString() }));
  },

  normalize(raw) {
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.commodities)
        ? (raw as any).commodities
        : [];

    return list.map((item: any): NormalizedCommodity => ({
      symbol: String(item.symbol ?? item.code ?? "OIL"),
      name: String(item.name ?? item.displayName ?? "Crude Oil"),
      unit: String(item.unit ?? "bbl"),
      price: Number(item.price ?? item.last ?? item.value ?? 0),
      changePercent: Number(item.changePercent ?? item.change_percent ?? item.change ?? 0),
      currency: String(item.currency ?? "USD"),
      updatedAt: String(item.updatedAt ?? item.timestamp ?? new Date().toISOString())
    }));
  },

  cache(data) {
    memoryCache.set(CACHE_KEY, data, TTL_MS);
  }
};

export function getCachedCommodities() {
  return memoryCache.get<NormalizedCommodity[]>(CACHE_KEY)
    ?? memoryCache.getStale<NormalizedCommodity[]>(CACHE_KEY)
    ?? fallbackCommodities;
}
