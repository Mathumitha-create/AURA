import { Router } from "express";
import { simulateDisruption } from "../agents";
import { db } from "../db";
import { getCachedCommodities } from "../providers/commodityProvider";
import { rankSuppliers } from "../services/marketService";

export const marketRouter = Router();

marketRouter.get("/", (_req, res) => {
  const ranked = rankSuppliers();
  res.json({
    commodities: getCachedCommodities(),
    suppliers: ranked.ranked,
    purchaseOrder: ranked.po
  });
});

marketRouter.post("/", async (req, res) => {
  try {
    const action = String(req.body?.action ?? "rank");

    if (action === "simulate") {
      const type = req.body.type;
      const percent = req.body.percent;
      if (!type || percent === undefined) {
        return res.status(400).json({ error: "Disruption type and severity percentage are required." });
      }

      const result = await simulateDisruption(String(type), Number(percent));
      const settings = db.get("settings");
      db.logAction("operator_alpha", settings.activeRole, "SCENARIO_SIMULATION_RUN", `Simulated ${type} disruption at ${percent}% severity`);
      return res.json(result);
    }

    const ranked = rankSuppliers();
    const settings = db.get("settings");
    db.logAction("operator_alpha", settings.activeRole, "PROCUREMENT_STRATEGY_GENERATED", `Generated sourcing ranking for top country: ${ranked.ranked[0].country}`);
    return res.json(ranked);
  } catch (_error) {
    return res.status(500).json({ error: "Failed to process market request." });
  }
});
