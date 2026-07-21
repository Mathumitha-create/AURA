import { Router } from "express";
import { simulateDisruption } from "../agents";
import { db } from "../db";
import { getCachedCommodities } from "../providers/commodityProvider";
import { rankSuppliers } from "../services/marketService";
import { agentOrchestrator } from "../agents";

export const marketRouter = Router();

marketRouter.get("/", (_req, res) => {
  const run = agentOrchestrator.run({ requestType: "procurement" });
  res.json({
    commodities: getCachedCommodities(),
    suppliers: run.procurement.rankedSuppliers,
    purchaseOrder: run.procurement.purchaseOrder,
    procurementAgent: run.procurement,
    agentRun: run
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

    const run = agentOrchestrator.run({ requestType: "procurement" });
    const settings = db.get("settings");
    db.logAction("operator_alpha", settings.activeRole, "PROCUREMENT_STRATEGY_GENERATED", `Generated sourcing ranking for top country: ${run.procurement.rankedSuppliers[0].country}`);
    return res.json({ ranked: run.procurement.rankedSuppliers, po: run.procurement.purchaseOrder, procurementAgent: run.procurement, agentRun: run });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to process market request." });
  }
});
