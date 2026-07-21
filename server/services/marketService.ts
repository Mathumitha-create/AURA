import { db } from "../db";
import { getCachedCommodities } from "../providers/commodityProvider";
import type { PurchaseOrder, SupplierOption } from "../models/aggregation";

const supplierCatalog = [
  { country: "Nigeria", type: "Bonny Light (Sweet)", symbol: "BRENT", transitDays: 18, congestion: 20 },
  { country: "United States", type: "WTI Crude (Light/Sweet)", symbol: "WTI", transitDays: 22, congestion: 15 },
  { country: "Saudi Arabia", type: "Arab Light (Medium/Sour)", symbol: "DUBAI", transitDays: 5, congestion: 40 },
  { country: "UAE", type: "Murban (Light/Sweet)", symbol: "DUBAI", transitDays: 4, congestion: 30 },
  { country: "Russia", type: "Urals (Medium/Sour)", symbol: "BRENT", transitDays: 25, congestion: 50 },
  { country: "Brazil", type: "Lula (Medium)", symbol: "BRENT", transitDays: 20, congestion: 10 }
];

const countryDiscounts: Record<string, number> = {
  Nigeria: -3.5,
  "United States": -7.2,
  "Saudi Arabia": -1.8,
  UAE: -2.9,
  Russia: -14.5,
  Brazil: -5.8
};

export function getBrentCommodity() {
  const commodities = getCachedCommodities();
  return commodities.find(item => item.symbol === "BRENT") ?? commodities[0];
}

export function rankSuppliers(): { ranked: SupplierOption[]; po: PurchaseOrder } {
  const riskScores = db.get("riskScores");
  const commodities = getCachedCommodities();
  const brent = getBrentCommodity();
  const getRisk = (name: string) => riskScores.find(r => r.name.toLowerCase().includes(name.toLowerCase()))?.score || 30;
  const getPrice = (symbol: string, country: string) => {
    const commodity = commodities.find(item => item.symbol === symbol) ?? brent;
    return Number(Math.max(1, commodity.price + (countryDiscounts[country] ?? 0)).toFixed(2));
  };

  const ranked = supplierCatalog.map(s => {
    const basePrice = getPrice(s.symbol, s.country);
    const risk = getRisk(s.country);
    const priceFactor = (100 - basePrice) * 0.3;
    const transitFactor = (30 - s.transitDays) * 0.25;
    const riskFactor = (100 - risk) * 0.3;
    const congestionFactor = (60 - s.congestion) * 0.15;
    const score = Math.round(Math.max(10, Math.min(99, priceFactor + transitFactor + riskFactor + congestionFactor + 30)));

    return {
      country: s.country,
      type: s.type,
      basePrice,
      transitDays: s.transitDays,
      risk,
      congestion: s.congestion,
      score
    };
  }).sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const po = {
    purchaseOrderId: `AURA-PO-${Date.now().toString().slice(-6)}`,
    supplier: top.country,
    crudeType: top.type,
    volumeBarrels: 2_000_000,
    basePricePerBarrel: top.basePrice,
    estimatedShippingCost: top.transitDays * 12000,
    etaDays: top.transitDays,
    savingsVsBrent: Math.round((brent.price - top.basePrice) * 2_000_000 - top.transitDays * 12000),
    summary: `PRO-RECOMMEND: Selected ${top.country} for immediate delivery of 2M barrels of ${top.type}. Offering compatibility rating of ${top.score}% due to optimized risk discount (${top.risk} index) and spot price of $${top.basePrice}/bbl. Logistics routing secures ETA in ${top.transitDays} days bypassing high-risk chokepoint hubs.`
  };

  return { ranked, po };
}
