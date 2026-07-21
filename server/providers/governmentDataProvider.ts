import { cache as memoryCache } from "../cache/memoryCache";
import type { Provider, SprSummary } from "../models/aggregation";
import { fetchJson } from "../utils/http";

const CACHE_KEY = "provider:government";
const TTL_MS = 5 * 60 * 1000;

const fallbackGovernment = {
  importDependencyPercent: 88,
  refineryUtilizationPercent: 98,
  spr: {
    caverns: [
      { name: "Padur Caverns (Karnataka)", capacityMillionBbl: 18, currentStockMillionBbl: 16.5, fillPercent: 91.6, fillStatus: "secure" },
      { name: "Mangalore Caverns (Karnataka)", capacityMillionBbl: 11, currentStockMillionBbl: 9.8, fillPercent: 89, fillStatus: "secure" },
      { name: "Visakhapatnam Caverns (AP)", capacityMillionBbl: 10, currentStockMillionBbl: 8.5, fillPercent: 85, fillStatus: "stable" }
    ],
    totalCapacity: 39,
    totalStock: 34.8,
    coverageDays: 9.5
  } satisfies SprSummary
};

export const governmentDataProvider: Provider<typeof fallbackGovernment> = {
  name: "government-data",

  async fetchLatest() {
    const url = process.env.GOVERNMENT_DATA_PROVIDER_URL;
    if (url) {
      return fetchJson(url);
    }

    return fallbackGovernment;
  },

  normalize(raw) {
    const item = (raw ?? {}) as any;
    const spr = item.spr ?? fallbackGovernment.spr;

    return {
      importDependencyPercent: Number(item.importDependencyPercent ?? item.import_dependency_percent ?? fallbackGovernment.importDependencyPercent),
      refineryUtilizationPercent: Number(item.refineryUtilizationPercent ?? item.refinery_utilization_percent ?? fallbackGovernment.refineryUtilizationPercent),
      spr: {
        caverns: Array.isArray(spr.caverns) ? spr.caverns : fallbackGovernment.spr.caverns,
        totalCapacity: Number(spr.totalCapacity ?? spr.total_capacity ?? fallbackGovernment.spr.totalCapacity),
        totalStock: Number(spr.totalStock ?? spr.total_stock ?? fallbackGovernment.spr.totalStock),
        coverageDays: Number(spr.coverageDays ?? spr.coverage_days ?? fallbackGovernment.spr.coverageDays)
      }
    };
  },

  cache(data) {
    memoryCache.set(CACHE_KEY, data, TTL_MS);
  }
};

export function getCachedGovernmentData() {
  return memoryCache.get<typeof fallbackGovernment>(CACHE_KEY)
    ?? memoryCache.getStale<typeof fallbackGovernment>(CACHE_KEY)
    ?? fallbackGovernment;
}
