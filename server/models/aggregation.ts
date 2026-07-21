import type { Article, RiskScore, Alert, SystemSettings, AuditLog } from "../db";

export interface ProviderEnvelope<T> {
  data: T;
  source: string;
  fetchedAt: string;
  cached: boolean;
}

export interface NormalizedCommodity {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  changePercent: number;
  currency: string;
  updatedAt: string;
}

export interface NormalizedWeatherAlert {
  id: string;
  region: string;
  condition: string;
  severity: "nominal" | "watch" | "warning" | "critical";
  windKts: number;
  waveHeightM: number;
  impact: string;
  updatedAt: string;
}

export interface NormalizedShip {
  id: string;
  name: string;
  vesselClass: string;
  cargoType: string;
  volumeBarrels: number;
  status: string;
  speedKnots: number;
  destinationPort: string;
  etaDays: number;
  coordinates: { x: number; y: number };
  riskScore: number;
  lastPingTime: string;
}

export interface SupplierOption {
  country: string;
  type: string;
  basePrice: number;
  transitDays: number;
  risk: number;
  congestion: number;
  score: number;
}

export interface PurchaseOrder {
  purchaseOrderId: string;
  supplier: string;
  crudeType: string;
  volumeBarrels: number;
  basePricePerBarrel: number;
  estimatedShippingCost: number;
  etaDays: number;
  savingsVsBrent: number;
  summary: string;
}

export interface SprCavern {
  name: string;
  capacityMillionBbl: number;
  currentStockMillionBbl: number;
  fillPercent: number;
  fillStatus: string;
}

export interface SprSummary {
  caverns: SprCavern[];
  totalCapacity: number;
  totalStock: number;
  coverageDays: number;
}

export interface DashboardKpis {
  importDependency: {
    value: string;
    subtitle: string;
    extraInfo: string;
  };
  sprBuffer: {
    value: string;
    subtitle: string;
    extraInfo: string;
  };
  brentCrude: {
    value: string;
    subtitle: string;
    extraInfo: string;
    trend: { value: string; isPositive: boolean };
  };
  activeThreats: {
    value: string;
    subtitle: string;
    extraInfo: string;
  };
}

export interface MapAsset {
  id: string;
  type: "refinery" | "chokepoint" | "tanker" | "port";
  name: string;
  coordinates: { x: number; y: number };
  status: string;
  riskScore: number;
  details: Record<string, string | number>;
  aiRecommendation: string;
}

export interface TwinNode {
  id: string;
  category: "port" | "route" | "tanker" | "refinery" | "spr" | "distribution";
  name: string;
  status: "nominal" | "warning" | "alert";
  x: number;
  y: number;
  details: Record<string, string | number>;
}

export interface TwinConnection {
  from: string;
  to: string;
  animated: boolean;
  color: string;
}

export interface ReportMeta {
  id: string;
  type: string;
  title: string;
  date: string;
  content?: string;
}

export interface DashboardPayload {
  kpis: DashboardKpis;
  news: Article[];
  market: {
    commodities: NormalizedCommodity[];
    suppliers: SupplierOption[];
    purchaseOrder: PurchaseOrder;
  };
  weather: NormalizedWeatherAlert[];
  ships: NormalizedShip[];
  government: {
    spr: SprSummary;
    importDependencyPercent: number;
    refineryUtilizationPercent: number;
    reports: ReportMeta[];
  };
  riskScores: RiskScore[];
  alerts: Alert[];
  mapAssets: MapAsset[];
  digitalTwin: {
    nodes: TwinNode[];
    connections: TwinConnection[];
  };
  settings: SystemSettings;
  auditLogs: AuditLog[];
  updatedAt: string;
}

export interface Provider<T> {
  readonly name: string;
  fetchLatest(): Promise<unknown>;
  normalize(raw: unknown): T;
  cache(data: T): void;
}
