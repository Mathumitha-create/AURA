import type { AgentContext, GeoRiskOutput, ProcurementOutput, SprOutput, SupplyChainOutput } from "./types";

export class SprAgent {
  public readonly name = "SPR Agent" as const;

  run(context: AgentContext, geoRisk: GeoRiskOutput, supplyChain: SupplyChainOutput, procurement: ProcurementOutput): SprOutput {
    const fillPercent = Math.round((context.spr.totalStock / Math.max(context.spr.totalCapacity, 1)) * 1000) / 10;
    const pressure = Math.max(geoRisk.riskScore, supplyChain.transitTime.deltaDays * 8, procurement.risk.compositeRisk);
    const recommendation: SprOutput["recommendation"] = pressure >= 72 ? "drawdown" : fillPercent < 82 ? "replenish" : "hold";
    const recommendedPercent = recommendation === "drawdown" ? clamp(Math.round((pressure - 55) / 2), 5, 22) : 0;
    const barrelsMillion = Math.round(context.spr.totalStock * (recommendedPercent / 100) * 100) / 100;
    const brent = context.commodities.find(item => item.symbol === "BRENT") ?? context.commodities[0];

    return {
      agent: this.name,
      coverage: { totalCapacityMillionBbl: context.spr.totalCapacity, totalStockMillionBbl: context.spr.totalStock, fillPercent },
      remainingDays: Math.max(0, Math.round((context.spr.coverageDays - supplyChain.transitTime.deltaDays * 0.18) * 10) / 10),
      recommendation,
      drawdown: { recommendedPercent, barrelsMillion, durationDays: recommendedPercent ? 14 : 0 },
      replenishment: {
        targetPricePerBbl: Math.round(((brent?.price ?? 87) - 8) * 100) / 100,
        window: recommendation === "replenish" ? "Immediate tender window" : "Next low-volatility pricing window",
        priority: recommendation === "replenish" ? "high" : pressure >= 65 ? "medium" : "low"
      },
      confidence: clamp(Math.round((geoRisk.confidence + procurement.confidence + 82) / 3), 55, 98)
    };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
