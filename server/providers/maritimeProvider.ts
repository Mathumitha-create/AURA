import { cache as memoryCache } from "../cache/memoryCache";
import type { NormalizedShip, Provider } from "../models/aggregation";
import { fetchJson } from "../utils/http";

const CACHE_KEY = "provider:maritime";
const TTL_MS = 5 * 60 * 1000;

const fallbackShips: NormalizedShip[] = [
  {
    id: "tanker-vishal",
    name: "MT Desh Vishal",
    vesselClass: "VLCC Supertanker",
    cargoType: "Arabian Light Crude",
    volumeBarrels: 2_000_000,
    status: "En-route Cape bypass",
    speedKnots: 14.5,
    destinationPort: "Jamnagar Port, India",
    etaDays: 6,
    coordinates: { x: 445, y: 325 },
    riskScore: 15,
    lastPingTime: "3 min ago via satellite"
  },
  {
    id: "tanker-kamal",
    name: "MT Swarna Kamal",
    vesselClass: "Suezmax Tanker",
    cargoType: "Bonny Light (Sweet)",
    volumeBarrels: 1_000_000,
    status: "Transit (Indian Ocean)",
    speedKnots: 12.8,
    destinationPort: "Mumbai Port, India",
    etaDays: 3,
    coordinates: { x: 625, y: 345 },
    riskScore: 22,
    lastPingTime: "12 min ago via VHF"
  }
];

export const maritimeProvider: Provider<NormalizedShip[]> = {
  name: "maritime",

  async fetchLatest() {
    const url = process.env.MARITIME_PROVIDER_URL;
    if (url) {
      return fetchJson(url);
    }

    return fallbackShips;
  },

  normalize(raw) {
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.ships)
        ? (raw as any).ships
        : Array.isArray((raw as any)?.vessels)
          ? (raw as any).vessels
          : [];

    return list.map((item: any, index: number): NormalizedShip => ({
      id: String(item.id ?? item.mmsi ?? `ship-${index}`),
      name: String(item.name ?? item.vesselName ?? "Unknown Tanker"),
      vesselClass: String(item.vesselClass ?? item.class ?? "Tanker"),
      cargoType: String(item.cargoType ?? item.cargo ?? "Crude Oil"),
      volumeBarrels: Number(item.volumeBarrels ?? item.volume_barrels ?? item.volume ?? 0),
      status: String(item.status ?? "In transit"),
      speedKnots: Number(item.speedKnots ?? item.speed_knots ?? item.speed ?? 0),
      destinationPort: String(item.destinationPort ?? item.destination ?? "India"),
      etaDays: Number(item.etaDays ?? item.eta_days ?? 0),
      coordinates: {
        x: Number(item.coordinates?.x ?? item.x ?? 0),
        y: Number(item.coordinates?.y ?? item.y ?? 0)
      },
      riskScore: Number(item.riskScore ?? item.risk_score ?? 30),
      lastPingTime: String(item.lastPingTime ?? item.last_ping ?? "unknown")
    }));
  },

  cache(data) {
    memoryCache.set(CACHE_KEY, data, TTL_MS);
  }
};

export function getCachedShips() {
  return memoryCache.get<NormalizedShip[]>(CACHE_KEY)
    ?? memoryCache.getStale<NormalizedShip[]>(CACHE_KEY)
    ?? fallbackShips;
}
