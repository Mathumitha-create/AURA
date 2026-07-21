import { Router, type Request, type Response, type NextFunction } from "express";
import { recalculateGeopoliticalRisk, simulateDisruption } from "../agents";
import { db } from "../db";
import { queryAuraCopilot } from "../rag";
import { buildDashboardPayload, updateSettings } from "../services/aggregationService";
import { rankSuppliers } from "../services/marketService";
import { generateReport, listReports } from "../services/reportService";
import { logger } from "../utils/logger";
import { createRateLimiter } from "../utils/rateLimit";
import { dashboardRouter } from "./dashboard";
import { marketRouter } from "./market";
import { newsRouter } from "./news";
import { shipsRouter } from "./ships";
import { weatherRouter } from "./weather";

export function createApiRouter() {
  const router = Router();

  router.use(createRateLimiter());
  router.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      logger.info("api request", {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - startedAt
      });
    });
    next();
  });

  router.use("/dashboard", dashboardRouter);
  router.use("/news", newsRouter);
  router.use("/market", marketRouter);
  router.use("/weather", weatherRouter);
  router.use("/ships", shipsRouter);

  attachCompatibilityRoutes(router);
  return router;
}

function attachCompatibilityRoutes(router: Router) {
  router.get("/georisk", (_req, res) => res.json(db.get("riskScores")));
  router.post("/georisk/evaluate", async (_req, res) => res.json(await recalculateGeopoliticalRisk()));
  router.post("/scenario/simulate", async (req, res) => res.json(await simulateDisruption(String(req.body.type), Number(req.body.percent))));
  router.post("/procurement/rank", (_req, res) => res.json(rankSuppliers()));
  router.get("/spr", (_req, res) => res.json(buildDashboardPayload().government.spr));
  router.post("/copilot", async (req, res) => res.json(await queryAuraCopilot(String(req.body.message ?? ""))));
  router.get("/reports", (_req, res) => res.json(listReports()));
  router.post("/reports/generate", (req, res) => res.status(201).json(generateReport(req.body.reportType)));
  router.get("/audit", (_req, res) => res.json(db.get("auditLogs")));
  router.get("/settings", (_req, res) => res.json(db.get("settings")));
  router.post("/settings", (req, res) => res.json(updateSettings(req.body)));
}
