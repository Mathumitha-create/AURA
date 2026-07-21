import type { Article, RiskScore } from "./db";
import { agentOrchestrator } from "./agents/orchestrator";

export async function analyzeNewsArticle(title: string, content: string, source: string): Promise<Article> {
  return agentOrchestrator.ingestNews(title, content, source);
}

export async function recalculateGeopoliticalRisk(): Promise<RiskScore[]> {
  return agentOrchestrator.recalculateRiskScores();
}

export interface SimulationResult {
  disruptionType: string;
  percent: number;
  oilImportDropPercent: number;
  brentPriceSpike: number;
  indiaGdpDragPercent: number;
  refineryUtilizationPercent: number;
  powerSectorLossPercent: number;
  importCostIncreaseBillions: number;
  sprDrawdownRecommendationDays: number;
  executiveSummary: string;
  agentRun?: ReturnType<typeof agentOrchestrator.run>;
}

export async function simulateDisruption(type: string, percent: number): Promise<SimulationResult> {
  const run = agentOrchestrator.run({ requestType: "scenario", scenario: { type, percent } });
  const severityScale = percent / 100;
  const routeDelay = run.supplyChain.transitTime.deltaDays;
  const geoPressure = run.geoRisk.riskScore / 100;
  const sprDrawdown = run.spr.drawdown.durationDays || Math.round(run.spr.remainingDays * severityScale * 0.5);

  return {
    disruptionType: type,
    percent,
    oilImportDropPercent: Math.round((run.procurement.risk.routeRisk * 0.42 + routeDelay * 3) * severityScale),
    brentPriceSpike: Math.round((run.geoRisk.riskScore * 0.38 + run.procurement.risk.compositeRisk * 0.22) * severityScale),
    indiaGdpDragPercent: Number((geoPressure * severityScale * 2.8).toFixed(1)),
    refineryUtilizationPercent: Math.max(35, Math.round(98 - run.procurement.risk.compositeRisk * 0.32 * severityScale - routeDelay)),
    powerSectorLossPercent: Math.round(run.procurement.risk.compositeRisk * 0.12 * severityScale),
    importCostIncreaseBillions: Number(((run.procurement.cost.totalDeliveredCost / 1_000_000_000) * severityScale).toFixed(1)),
    sprDrawdownRecommendationDays: sprDrawdown,
    executiveSummary: run.executive.executiveSummary,
    agentRun: run
  };
}

export { agentOrchestrator };
