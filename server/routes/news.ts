import { Router } from "express";
import { analyzeNewsArticle } from "../agents";
import { getCachedNews } from "../providers/newsProvider";
import { generateReport, listReports } from "../services/reportService";

export const newsRouter = Router();

newsRouter.get("/", (req, res) => {
  const resource = String(req.query.resource ?? "");
  if (resource === "reports") return res.json(listReports());
  return res.json(getCachedNews());
});

newsRouter.post("/", async (req, res) => {
  try {
    const action = String(req.body?.action ?? "ingest");

    if (action === "generateReport") {
      return res.status(201).json(generateReport(req.body.reportType));
    }

    const { title, content, source } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    const newArticle = await analyzeNewsArticle(title, content, source || "Manual Ingestion");
    return res.status(201).json(newArticle);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to process news request." });
  }
});

newsRouter.post("/ingest", async (req, res) => {
  try {
    const { title, content, source } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }
    const newArticle = await analyzeNewsArticle(title, content, source || "Manual Ingestion");
    return res.status(201).json(newArticle);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to ingest news article." });
  }
});
