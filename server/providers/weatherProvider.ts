import { cache as memoryCache } from "../cache/memoryCache";
import type { NormalizedWeatherAlert, Provider } from "../models/aggregation";
import { fetchJson } from "../utils/http";

const CACHE_KEY = "provider:weather";
const TTL_MS = 5 * 60 * 1000;

const fallbackWeather: NormalizedWeatherAlert[] = [
  {
    id: "wx-arabian-sea",
    region: "Arabian Sea",
    condition: "Monsoon swells",
    severity: "watch",
    windKts: 26,
    waveHeightM: 3.1,
    impact: "Monitor offshore SBM unloading windows near Gujarat and Maharashtra.",
    updatedAt: new Date().toISOString()
  },
  {
    id: "wx-indian-ocean",
    region: "Central Indian Ocean",
    condition: "Cyclone watch corridor",
    severity: "warning",
    windKts: 38,
    waveHeightM: 4.4,
    impact: "Tanker arrivals should preserve schedule buffer for high-swell routing.",
    updatedAt: new Date().toISOString()
  }
];

export const weatherProvider: Provider<NormalizedWeatherAlert[]> = {
  name: "weather",

  async fetchLatest() {
    const url = process.env.WEATHER_PROVIDER_URL;
    if (url) {
      return fetchJson(url);
    }

    return fallbackWeather.map(item => ({ ...item, updatedAt: new Date().toISOString() }));
  },

  normalize(raw) {
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.alerts)
        ? (raw as any).alerts
        : [];

    return list.map((item: any, index: number): NormalizedWeatherAlert => ({
      id: String(item.id ?? `wx-${index}`),
      region: String(item.region ?? item.area ?? item.name ?? "Indian Ocean"),
      condition: String(item.condition ?? item.event ?? "Marine weather watch"),
      severity: normalizeSeverity(item.severity ?? item.level),
      windKts: Number(item.windKts ?? item.wind_kts ?? item.windSpeed ?? 0),
      waveHeightM: Number(item.waveHeightM ?? item.wave_height_m ?? item.waveHeight ?? 0),
      impact: String(item.impact ?? item.description ?? "No material routing impact."),
      updatedAt: String(item.updatedAt ?? item.timestamp ?? new Date().toISOString())
    }));
  },

  cache(data) {
    memoryCache.set(CACHE_KEY, data, TTL_MS);
  }
};

function normalizeSeverity(value: unknown): NormalizedWeatherAlert["severity"] {
  const normalized = String(value ?? "").toLowerCase();
  if (["critical", "severe"].includes(normalized)) return "critical";
  if (["warning", "high"].includes(normalized)) return "warning";
  if (["watch", "medium"].includes(normalized)) return "watch";
  return "nominal";
}

export function getCachedWeather() {
  return memoryCache.get<NormalizedWeatherAlert[]>(CACHE_KEY)
    ?? memoryCache.getStale<NormalizedWeatherAlert[]>(CACHE_KEY)
    ?? fallbackWeather;
}
