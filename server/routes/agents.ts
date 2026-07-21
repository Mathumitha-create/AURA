import { Router } from "express";
import { agentOrchestrator } from "../agents";

export const agentsRouter = Router();

agentsRouter.post("/run", (req, res) => {
  const run = agentOrchestrator.run({
    requestType: req.body?.requestType || "briefing",
    scenario: req.body?.scenario,
    message: req.body?.message,
    reportType: req.body?.reportType,
    newsArticle: req.body?.newsArticle
  });
  res.json(run);
});

agentsRouter.get("/status", (_req, res) => {
  res.json({
    orchestrator: "Agent Orchestrator",
    communication: "structured-json",
    agents: [
      "GeoRisk Agent",
      "Supply Chain Agent",
      "Procurement Agent",
      "SPR Agent",
      "Executive Briefing Agent"
    ],
    pipeline: [
      "GeoRisk Agent -> Supply Chain Agent",
      "Supply Chain Agent -> Procurement Agent",
      "Procurement Agent -> SPR Agent",
      "SPR Agent -> Executive Briefing Agent"
    ]
  });
});
