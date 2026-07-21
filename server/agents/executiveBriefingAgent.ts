import type { ExecutiveBriefingOutput, GeoRiskOutput, ProcurementOutput, SprOutput, SupplyChainOutput } from "./types";

export class ExecutiveBriefingAgent {
  public readonly name = "Executive Briefing Agent" as const;

  run(
    geoRisk: GeoRiskOutput,
    supplyChain: SupplyChainOutput,
    procurement: ProcurementOutput,
    spr: SprOutput,
    reportType = "Daily Briefing"
  ): ExecutiveBriefingOutput {
    const topRegion = geoRisk.affectedRegions[0] || "Global Oil Market";
    const topDelay = supplyChain.delayedRoutes[0];
    const topSupplier = procurement.rankedSuppliers[0];
    const actionPlan = [
      `Monitor ${topRegion} at risk score ${geoRisk.riskScore}/100 with ${geoRisk.confidence}% confidence.`,
      topDelay ? `Mitigate delayed route ${topDelay.route}; current delay estimate ${topDelay.delayDays} days.` : "Maintain active route monitoring; no major route delay exceeds threshold.",
      `Procure from ${topSupplier.country} using ${procurement.transit.route}; delivered-cost estimate $${procurement.cost.totalDeliveredCost.toLocaleString()}.`,
      spr.recommendation === "drawdown" ? `Authorize ${spr.drawdown.recommendedPercent}% SPR drawdown over ${spr.drawdown.durationDays} days.` : `SPR status ${spr.recommendation}; maintain ${spr.remainingDays} days coverage.`
    ];

    return {
      agent: this.name,
      executiveSummary: `${reportType}: ${topRegion} is the lead risk vector. Supply chain delay delta is ${supplyChain.transitTime.deltaDays} days; recommended supplier is ${topSupplier.country}.`,
      riskAssessment: `GeoRisk ${geoRisk.riskScore}/100; procurement composite risk ${procurement.risk.compositeRisk}/100; SPR remaining coverage ${spr.remainingDays} days.`,
      actionPlan,
      ministerBriefing: `Ministerial note: AURA multi-agent consensus recommends ${topSupplier.country} sourcing, ${spr.recommendation} SPR posture, and continued monitoring of ${topRegion}. Confidence ${Math.round((geoRisk.confidence + supplyChain.confidence + procurement.confidence + spr.confidence) / 4)}%.`,
      confidence: Math.round((geoRisk.confidence + supplyChain.confidence + procurement.confidence + spr.confidence) / 4)
    };
  }
}
