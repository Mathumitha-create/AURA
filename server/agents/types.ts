import type { Article, RiskScore } from "../db";
import type { KnowledgeGraph } from "../models/graph";
import type { NormalizedCommodity, NormalizedShip, NormalizedWeatherAlert, SprSummary, SupplierOption, PurchaseOrder } from "../models/aggregation";

export interface AgentContext {
  requestType: "news" | "risk" | "procurement" | "spr" | "briefing" | "scenario" | "copilot";
  newsArticle?: Pick<Article, "title" | "content" | "source">;
  scenario?: { type: string; percent: number };
  message?: string;
  reportType?: string;
  graph: KnowledgeGraph;
  riskScores: RiskScore[];
  commodities: NormalizedCommodity[];
  ships: NormalizedShip[];
  weather: NormalizedWeatherAlert[];
  spr: SprSummary;
  suppliers: { ranked: SupplierOption[]; po: PurchaseOrder };
}

export interface GeoRiskOutput {
  agent: "GeoRisk Agent";
  riskScore: number;
  affectedRegions: string[];
  confidence: number;
  sanctions: Array<{ region: string; severity: number; evidence: string }>;
  conflicts: Array<{ region: string; severity: number; evidence: string }>;
  maritimeSecurity: Array<{ chokepoint: string; severity: number; evidence: string }>;
  regionalRisks: Array<{ id: string; name: string; score: number; trend: "up" | "down" | "stable"; confidence: number }>;
  newsAnalysis?: Article["analysis"];
}

export interface SupplyChainOutput {
  agent: "Supply Chain Agent";
  delayedRoutes: Array<{ route: string; delayDays: number; cause: string; risk: number }>;
  affectedPorts: Array<{ port: string; status: string; risk: number }>;
  affectedTankers: Array<{ tanker: string; status: string; transitTimeDays: number; risk: number }>;
  bottlenecks: Array<{ node: string; reason: string; severity: number }>;
  transitTime: { baselineDays: number; currentDays: number; deltaDays: number };
  confidence: number;
}

export interface ProcurementOutput {
  agent: "Procurement Agent";
  rankedSuppliers: Array<SupplierOption & { reliability: number; estimatedCost: number; alternateRoute: string }>;
  cost: { currency: "USD"; recommendedCargoCost: number; estimatedShippingCost: number; totalDeliveredCost: number };
  transit: { supplier: string; days: number; route: string };
  risk: { supplierRisk: number; routeRisk: number; compositeRisk: number };
  recommendation: string;
  purchaseOrder: PurchaseOrder;
  confidence: number;
}

export interface SprOutput {
  agent: "SPR Agent";
  coverage: { totalCapacityMillionBbl: number; totalStockMillionBbl: number; fillPercent: number };
  remainingDays: number;
  recommendation: "hold" | "drawdown" | "replenish";
  drawdown: { recommendedPercent: number; barrelsMillion: number; durationDays: number };
  replenishment: { targetPricePerBbl: number; window: string; priority: "low" | "medium" | "high" };
  confidence: number;
}

export interface ExecutiveBriefingOutput {
  agent: "Executive Briefing Agent";
  executiveSummary: string;
  riskAssessment: string;
  actionPlan: string[];
  ministerBriefing: string;
  confidence: number;
}

export interface AgentRunResult {
  runId: string;
  generatedAt: string;
  context: { requestType: AgentContext["requestType"]; scenario?: AgentContext["scenario"]; reportType?: string };
  geoRisk: GeoRiskOutput;
  supplyChain: SupplyChainOutput;
  procurement: ProcurementOutput;
  spr: SprOutput;
  executive: ExecutiveBriefingOutput;
}
