import { db, type SystemSettings } from "../db";
import type {
  DashboardKpis,
  DashboardPayload,
  MapAsset,
  TwinConnection,
  TwinNode
} from "../models/aggregation";
import { getCachedCommodities } from "../providers/commodityProvider";
import { getCachedGovernmentData } from "../providers/governmentDataProvider";
import { getCachedNews } from "../providers/newsProvider";
import { getCachedShips } from "../providers/maritimeProvider";
import { getCachedWeather } from "../providers/weatherProvider";
import { rankSuppliers } from "./marketService";
import { listReports } from "./reportService";

export function buildDashboardPayload(): DashboardPayload {
  const news = getCachedNews();
  const commodities = getCachedCommodities();
  const weather = getCachedWeather();
  const ships = getCachedShips();
  const government = getCachedGovernmentData();
  const ranked = rankSuppliers();
  const riskScores = db.get("riskScores");
  const alerts = db.get("alerts");

  return {
    kpis: buildKpis(),
    news,
    market: {
      commodities,
      suppliers: ranked.ranked,
      purchaseOrder: ranked.po
    },
    weather,
    ships,
    government: {
      ...government,
      reports: listReports()
    },
    riskScores,
    alerts,
    mapAssets: buildMapAssets(),
    digitalTwin: buildDigitalTwin(),
    settings: db.get("settings"),
    auditLogs: db.get("auditLogs"),
    updatedAt: new Date().toISOString()
  };
}

export function buildKpis(): DashboardKpis {
  const government = getCachedGovernmentData();
  const commodities = getCachedCommodities();
  const brent = commodities.find(item => item.symbol === "BRENT") ?? commodities[0];
  const criticalThreats = db.get("alerts").filter(alert => !alert.acknowledged && alert.severity === "critical").length;
  const riskScores = db.get("riskScores");
  const averageConfidence = Math.round(
    getCachedNews().reduce((sum, article) => sum + (article.analysis?.confidence ?? 90), 0) / Math.max(getCachedNews().length, 1)
  );
  const maxThreats = Math.max(criticalThreats, riskScores.filter(score => score.score >= 75).length);

  return {
    importDependency: {
      value: `${government.importDependencyPercent}%`,
      subtitle: "OF TOTAL CRUDE DEMAND",
      extraInfo: "Load balanced"
    },
    sprBuffer: {
      value: `${government.spr.coverageDays} Days`,
      subtitle: "NET IMPORT COVER",
      extraInfo: "Secured status"
    },
    brentCrude: {
      value: `$${brent.price.toFixed(2)}/bbl`,
      subtitle: "VOLATILITY DEVIATION",
      extraInfo: `${brent.changePercent >= 0 ? "+" : ""}${brent.changePercent}% daily delta`,
      trend: {
        value: `${brent.changePercent >= 0 ? "+" : ""}${brent.changePercent}%`,
        isPositive: brent.changePercent >= 0
      }
    },
    activeThreats: {
      value: `${maxThreats} Critical`,
      subtitle: "GEOPOLITICAL MARITIME RISKS",
      extraInfo: `AI Confidence: ${averageConfidence}%`
    }
  };
}

export function buildMapAssets(): MapAsset[] {
  const government = getCachedGovernmentData();
  const ships = getCachedShips();
  const weather = getCachedWeather();
  const risks = db.get("riskScores");
  const risk = (name: string, fallback: number) => risks.find(item => item.name.toLowerCase().includes(name.toLowerCase()))?.score ?? fallback;
  const weatherImpact = weather[0]?.impact ?? "Standard ocean conditions.";

  const refineries: MapAsset[] = [
    {
      id: "ref-jamnagar",
      type: "refinery",
      name: "Jamnagar Refinery Complex",
      coordinates: { x: 690, y: 220 },
      status: `Operational (${government.refineryUtilizationPercent}% load)`,
      riskScore: 25,
      details: {
        capacityBarrelsPerDay: "1,240,000 bpd",
        primarySuppliers: "Saudi Arabia, Iraq, UAE",
        inventoryReserveLevel: "85%",
        importDependencyPercent: `${government.importDependencyPercent}%`,
        alternativeSupplier: "Nigeria, United States",
        freightTransitDays: "18 days (from West Africa)",
        estimatedSBMDelay: weatherImpact
      },
      aiRecommendation: "Maintain standard inventory. Target spot-arbitrage deals with US Gulf Coast to bypass Persian Gulf pricing premiums."
    },
    {
      id: "ref-vadinar",
      type: "refinery",
      name: "Vadinar Refinery (Nayara Energy)",
      coordinates: { x: 678, y: 215 },
      status: "Operational",
      riskScore: 30,
      details: {
        capacityBarrelsPerDay: "400,000 bpd",
        primarySuppliers: "Russia, Iraq",
        inventoryReserveLevel: "80%",
        importDependencyPercent: "90%",
        alternativeSupplier: "Guyana, Brazil",
        freightTransitDays: "25 days (from Urals)",
        estimatedSBMDelay: weatherImpact
      },
      aiRecommendation: "Secure Urals cargoes using non-USD transactions. Prepare alternative logistics routes via Mumbai terminal if regional swells increase."
    },
    {
      id: "ref-mumbai",
      type: "refinery",
      name: "Mumbai Refinery (BPCL/HPCL)",
      coordinates: { x: 700, y: 242 },
      status: "Nominal",
      riskScore: 20,
      details: {
        capacityBarrelsPerDay: "270,000 bpd",
        primarySuppliers: "Saudi Arabia, Iraq",
        inventoryReserveLevel: "78%",
        importDependencyPercent: "82%",
        alternativeSupplier: "Kuwait, Oman",
        freightTransitDays: "4 days (Persian Gulf)",
        estimatedSBMDelay: "1-2 Days (harbor congestion)"
      },
      aiRecommendation: "Deploy coastal tankers to reroute local crude from Bombay High oilfields to offset short-term Middle East disruptions."
    }
  ];

  const chokepoints: MapAsset[] = [
    {
      id: "choke-hormuz",
      type: "chokepoint",
      name: "Strait of Hormuz",
      coordinates: { x: 622, y: 255 },
      status: "High Risk (Intimidation Patrols)",
      riskScore: risk("Hormuz", 85),
      details: {
        dailyFlowVolume: "20.5 Million bpd",
        globalTrafficPercent: "20% of consumption",
        activeVesselsInTransit: 14,
        threatType: "Naval harassment, drone surveillance, cargo boardings",
        alternativeRoutes: "Cape of Good Hope, East-West Pipeline (Saudi)",
        transitTimeDelta: "+11 Days (via Cape bypass)"
      },
      aiRecommendation: "CRITICAL ALERT: Geopolitical friction points suggest rerouting tankers to Cape of Good Hope immediately. Request naval escort coordinates for critical state-owned cargoes."
    },
    {
      id: "choke-bab",
      type: "chokepoint",
      name: "Bab-el-Mandeb Strait",
      coordinates: { x: 560, y: 295 },
      status: "Elevated Risk (Drone Activity)",
      riskScore: risk("Bab", 78),
      details: {
        dailyFlowVolume: "6.2 Million bpd",
        globalTrafficPercent: "8% of consumption",
        activeVesselsInTransit: 8,
        threatType: "Drone and missile strikes from coastal rebel batteries",
        alternativeRoutes: "Cape of Good Hope bypass",
        transitTimeDelta: "+9.5 Days (via Africa)"
      },
      aiRecommendation: "ADVISORY: Instruct Suez-bound tankers to divert south of Africa unless running under joint military-taskforce naval escort convoy."
    },
    {
      id: "choke-suez",
      type: "chokepoint",
      name: "Suez Canal",
      coordinates: { x: 505, y: 172 },
      status: "Stable (Delayed Transits)",
      riskScore: risk("Suez", 50),
      details: {
        dailyFlowVolume: "5.5 Million bpd",
        backlogVesselsCount: 42,
        threatType: "Logistical backlog from Red Sea diversions",
        alternativeRoutes: "Cape of Good Hope bypass",
        transitTimeDelta: "Vessel queue times average 36 hours"
      },
      aiRecommendation: "Monitor Rotterdam-bound product tankers. Pre-order port berths at destination to prevent terminal demurrage fees."
    },
    {
      id: "choke-cape",
      type: "chokepoint",
      name: "Cape of Good Hope",
      coordinates: { x: 520, y: 415 },
      status: "Operational (High Traffic)",
      riskScore: risk("Cape", 15),
      details: {
        dailyFlowVolume: "8.4 Million bbl (diverted flow)",
        vesselCongestionIndex: "180% above baseline",
        bunkeringAvailability: "Tight in South African ports",
        threatType: "Severe sea swells and marine refueling bottlenecks",
        alternativeRoutes: "Suez Canal (high risk)",
        transitTimeDelta: "+10 Days average"
      },
      aiRecommendation: "Logistics systems must pre-book bunker fuel at Durban and Cape Town. Build a 10-day buffer supply into refining run models."
    }
  ];

  const tankerAssets = ships.map((ship): MapAsset => ({
    id: ship.id,
    type: "tanker",
    name: ship.name,
    coordinates: ship.coordinates,
    status: ship.status,
    riskScore: ship.riskScore,
    details: {
      cargoType: ship.cargoType,
      volumeBarrels: `${ship.volumeBarrels.toLocaleString()} bbl`,
      speedKnots: `${ship.speedKnots} kts`,
      destinationPort: ship.destinationPort,
      etaDate: `In ${ship.etaDays} Days`,
      lastPingTime: ship.lastPingTime
    },
    aiRecommendation: ship.riskScore > 50 ? "Route requires live security monitoring." : "Tanker is running on schedule. Standard ocean conditions."
  }));

  return [...refineries, ...chokepoints, ...tankerAssets];
}

export function buildDigitalTwin(): { nodes: TwinNode[]; connections: TwinConnection[] } {
  const government = getCachedGovernmentData();
  const ships = getCachedShips();
  const risks = db.get("riskScores");
  const risk = (name: string, fallback: number) => risks.find(item => item.name.toLowerCase().includes(name.toLowerCase()))?.score ?? fallback;
  const routeStatus = (score: number): TwinNode["status"] => score > 75 ? "alert" : score > 45 ? "warning" : "nominal";

  const nodes: TwinNode[] = [
    { id: "node-tanura", category: "port", name: "Ras Tanura Terminal", status: "nominal", x: 80, y: 100, details: { country: "Saudi Arabia", capacity: "6.5 M bpd", loadingDocks: "12 Active", riskIndex: `${risk("Saudi", 35)}/100`, securityLevel: "ALPHA" } },
    { id: "node-bonny", category: "port", name: "Bonny Island Port", status: "warning", x: 80, y: 250, details: { country: "Nigeria", capacity: "2.1 M bpd", loadingDocks: "5 Active", riskIndex: `${risk("Nigeria", 45)}/100`, securityLevel: "BETA" } },
    { id: "node-houston", category: "port", name: "Port of Houston", status: "nominal", x: 80, y: 400, details: { country: "United States", capacity: "4.8 M bpd", loadingDocks: "9 Active", riskIndex: `${risk("United States", 20)}/100`, securityLevel: "ALPHA" } },
    { id: "node-hormuz-route", category: "route", name: "Hormuz Sea Route", status: routeStatus(risk("Hormuz", 85)), x: 240, y: 150, details: { status: "Intimidation Patrols", dailyVessels: 14, currentThroughput: "14.2 M bpd", threatRating: `${risk("Hormuz", 85)}/100`, activeBlockadeLevel: "Critical" } },
    { id: "node-cape-route", category: "route", name: "Cape Bypass Route", status: routeStatus(risk("Cape", 15)), x: 240, y: 350, details: { status: "High Volume Transit", dailyVessels: 28, currentThroughput: "8.4 M bpd", threatRating: `${risk("Cape", 15)}/100`, congestionLevel: "Elevated" } },
    { id: "node-tanker-vishal", category: "tanker", name: ships[0]?.name ?? "MT Desh Vishal", status: "nominal", x: 420, y: 180, details: { vesselClass: ships[0]?.vesselClass ?? "VLCC Supertanker", cargo: `${ships[0]?.volumeBarrels.toLocaleString() ?? "2,000,000"} bbl ${ships[0]?.cargoType ?? "Arab Light"}`, speed: `${ships[0]?.speedKnots ?? 14.5} kts`, heading: "085 deg ENE", destination: ships[0]?.destinationPort ?? "Jamnagar Port", eta: `${ships[0]?.etaDays ?? 6} Days` } },
    { id: "node-tanker-kamal", category: "tanker", name: ships[1]?.name ?? "MT Swarna Kamal", status: "nominal", x: 420, y: 320, details: { vesselClass: ships[1]?.vesselClass ?? "Suezmax Tanker", cargo: `${ships[1]?.volumeBarrels.toLocaleString() ?? "1,000,000"} bbl ${ships[1]?.cargoType ?? "Bonny Light"}`, speed: `${ships[1]?.speedKnots ?? 12.8} kts`, heading: "090 deg E", destination: ships[1]?.destinationPort ?? "Mumbai Terminal", eta: `${ships[1]?.etaDays ?? 3} Days` } },
    { id: "node-ref-jamnagar", category: "refinery", name: "Jamnagar Refinery", status: "nominal", x: 600, y: 180, details: { operator: "Reliance Industries", utilization: `${government.refineryUtilizationPercent}% design capacity`, dailyOutput: "1,240,000 bpd", inventoryLevel: "85%", supplyStatus: "Stable" } },
    { id: "node-ref-mumbai", category: "refinery", name: "Mumbai Refinery", status: "warning", x: 600, y: 320, details: { operator: "BPCL / HPCL", utilization: "88% design capacity", dailyOutput: "270,000 bpd", inventoryLevel: "78%", supplyStatus: "Buffer Drawdown" } },
    { id: "node-spr-padur", category: "spr", name: "Padur SPR Caverns", status: "nominal", x: 760, y: 220, details: { state: "Karnataka, India", capacity: `${government.spr.caverns[0]?.capacityMillionBbl ?? 18} Million bbl`, activeVolume: `${government.spr.caverns[0]?.currentStockMillionBbl ?? 16.5} Million bbl`, fillPercent: `${government.spr.caverns[0]?.fillPercent ?? 91.6}%`, drawdownShed: "Hold (Ready)" } },
    { id: "node-dist-metropolis", category: "distribution", name: "Metropolis Grid Hub", status: "warning", x: 920, y: 250, details: { gridSector: "Western India Hub", baselineLoad: `${government.importDependencyPercent}% peak`, activeFrequency: "60.02 Hz", auxiliaryBatteryReserves: "1200MW capacity", activeOutput: "150MW active output" } }
  ];

  const connections: TwinConnection[] = [
    { from: "node-tanura", to: "node-hormuz-route", animated: true, color: "#EF4444" },
    { from: "node-bonny", to: "node-cape-route", animated: true, color: "#10B981" },
    { from: "node-houston", to: "node-cape-route", animated: true, color: "#10B981" },
    { from: "node-hormuz-route", to: "node-tanker-vishal", animated: true, color: "#EF4444" },
    { from: "node-cape-route", to: "node-tanker-kamal", animated: true, color: "#10B981" },
    { from: "node-tanker-vishal", to: "node-ref-jamnagar", animated: true, color: "#F2C94C" },
    { from: "node-tanker-kamal", to: "node-ref-mumbai", animated: true, color: "#F2C94C" },
    { from: "node-ref-jamnagar", to: "node-spr-padur", animated: false, color: "#3E4E68" },
    { from: "node-ref-mumbai", to: "node-spr-padur", animated: false, color: "#3E4E68" },
    { from: "node-spr-padur", to: "node-dist-metropolis", animated: true, color: "#0A84FF" }
  ];

  return { nodes, connections };
}

export function updateSettings(updated: Partial<SystemSettings>) {
  const current = db.get("settings");
  const next = { ...current, ...updated };
  db.update("settings", next);

  if (updated.activeRole && updated.activeRole !== current.activeRole) {
    db.logAction("admin_nexus", "NEXUS COMMANDER", "ROLE_MODIFICATION", `Swapped active command permission group to ${updated.activeRole}`);
  } else {
    db.logAction("admin_nexus", "NEXUS COMMANDER", "SETTINGS_UPDATED", "Modified sensor telemetry profiles and notification channels");
  }

  return next;
}
