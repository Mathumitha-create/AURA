import { Router } from "express";
import { db } from "../db";
import { queryAuraCopilot } from "../rag";
import { buildDashboardPayload, updateSettings } from "../services/aggregationService";
import { generateReport, listReports } from "../services/reportService";

export const dashboardRouter = Router();

dashboardRouter.get("/", (req, res) => {
  const payload = buildDashboardPayload();
  const resource = String(req.query.resource ?? "");

  if (resource === "settings") return res.json(payload.settings);
  if (resource === "audit") return res.json(payload.auditLogs);
  if (resource === "reports") return res.json(listReports());
  if (resource === "riskScores") return res.json(payload.riskScores);
  if (resource === "spr") return res.json(payload.government.spr);
  if (resource === "mapAssets") return res.json(payload.mapAssets);
  if (resource === "digitalTwin") return res.json(payload.digitalTwin);

  return res.json(payload);
});

dashboardRouter.post("/", async (req, res) => {
  try {
    const action = String(req.body?.action ?? "");

    if (action === "updateSettings") {
      return res.json(updateSettings(req.body.settings ?? {}));
    }

    if (action === "copilot") {
      if (!req.body.message) {
        return res.status(400).json({ error: "Message query is required." });
      }
      const response = await queryAuraCopilot(String(req.body.message));
      return res.json(response);
    }

    if (action === "generateReport") {
      return res.status(201).json(generateReport(req.body.reportType));
    }

    if (action === "log") {
      db.logAction("operator_alpha", db.get("settings").activeRole, String(req.body.event ?? "DASHBOARD_ACTION"), String(req.body.details ?? ""));
      return res.status(201).json({ ok: true });
    }

    return res.status(400).json({ error: "Unsupported dashboard action." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message ?? "Dashboard action failed." });
  }
});
