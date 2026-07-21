import type { AgentContext, GeoRiskOutput, ProcurementOutput, SupplyChainOutput } from "./types";

export class ProcurementAgent {
  public readonly name = "Procurement Agent" as const;

  run(context: AgentContext, geoRisk: GeoRiskOutput, supplyChain: SupplyChainOutput): ProcurementOutput {
    const brent = context.commodities.find(item => item.symbol === "BRENT") ?? context.commodities[0];
    const rankedSuppliers = context.suppliers.ranked.map(supplier => {
      const graphNode = context.graph.nodes.find(node => node.label.toLowerCase().includes(supplier.country.toLowerCase()) || supplier.country.toLowerCase().includes(node.label.toLowerCase()));
      const routePenalty = supplyChain.delayedRoutes.some(route => route.route.toLowerCase().includes(supplier.country.toLowerCase())) ? 12 : 0;
      const reliability = clamp(Math.round(100 - supplier.risk * 0.5 - supplier.congestion * 0.25 - routePenalty), 10, 99);
      const estimatedCost = Math.round(supplier.basePrice * 2_000_000 + supplier.transitDays * 12_000 + routePenalty * 85_000);
      return {
        ...supplier,
        risk: Math.max(supplier.risk, graphNode?.riskScore ?? 0, Math.round(geoRisk.riskScore * 0.35)),
        reliability,
        estimatedCost,
        alternateRoute: supplier.transitDays <= 8 ? "Persian Gulf direct / pipeline optional" : "Cape of Good Hope / deepwater routing"
      };
    }).sort((a, b) => (b.score + b.reliability) - (a.score + a.reliability));

    const top = rankedSuppliers[0];
    const routeRisk = Math.max(geoRisk.riskScore, supplyChain.delayedRoutes[0]?.risk ?? 0);
    const compositeRisk = clamp(Math.round(top.risk * 0.45 + routeRisk * 0.35 + (100 - top.reliability) * 0.2), 0, 100);
    const recommendedCargoCost = Math.round(top.basePrice * 2_000_000);
    const estimatedShippingCost = top.transitDays * 12_000 + supplyChain.transitTime.deltaDays * 18_000;

    return {
      agent: this.name,
      rankedSuppliers,
      cost: {
        currency: "USD",
        recommendedCargoCost,
        estimatedShippingCost,
        totalDeliveredCost: recommendedCargoCost + estimatedShippingCost
      },
      transit: { supplier: top.country, days: top.transitDays + supplyChain.transitTime.deltaDays, route: top.alternateRoute },
      risk: { supplierRisk: top.risk, routeRisk, compositeRisk },
      recommendation: `Select ${top.country} for ${top.type}; reliability ${top.reliability}% with composite risk ${compositeRisk}/100 against Brent reference ${brent?.price ?? top.basePrice}.`,
      purchaseOrder: {
        ...context.suppliers.po,
        supplier: top.country,
        crudeType: top.type,
        basePricePerBarrel: top.basePrice,
        estimatedShippingCost,
        etaDays: top.transitDays + supplyChain.transitTime.deltaDays,
        savingsVsBrent: Math.round(((brent?.price ?? top.basePrice) - top.basePrice) * 2_000_000 - estimatedShippingCost),
        summary: `PRO-RECOMMEND: ${top.country} ranked highest by Procurement Agent using GeoRisk, Supply Chain delay, reliability, and delivered-cost inputs. ${top.alternateRoute}.`
      },
      confidence: clamp(Math.round((geoRisk.confidence + supplyChain.confidence + top.reliability) / 3), 55, 97)
    };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
