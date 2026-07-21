import type { Article, RiskScore } from "../db";
import { db } from "../db";
import { getCachedCommodities } from "../providers/commodityProvider";
import { getCachedGovernmentData } from "../providers/governmentDataProvider";
import { getCachedShips } from "../providers/maritimeProvider";
import { getCachedWeather } from "../providers/weatherProvider";
import { buildKnowledgeGraph, updateGraphFromNewsArticle } from "../services/graphService";
import { rankSuppliers } from "../services/marketService";
import { ExecutiveBriefingAgent } from "./executiveBriefingAgent";
import { GeoRiskAgent } from "./geoRiskAgent";
import { ProcurementAgent } from "./procurementAgent";
import { SprAgent } from "./sprAgent";
import { SupplyChainAgent } from "./supplyChainAgent";
import type { AgentContext, AgentRunResult } from "./types";

export class AgentOrchestrator {
  private geoRiskAgent = new GeoRiskAgent();
  private supplyChainAgent = new SupplyChainAgent();
  private procurementAgent = new ProcurementAgent();
  private sprAgent = new SprAgent();
  private executiveBriefingAgent = new ExecutiveBriefingAgent();

  run(input: Partial<AgentContext> = {}): AgentRunResult {
    const context = this.buildContext(input);
    const geoRisk = this.geoRiskAgent.run(context);
    const supplyChain = this.supplyChainAgent.run(context, geoRisk);
    const procurement = this.procurementAgent.run(context, geoRisk, supplyChain);
    const spr = this.sprAgent.run(context, geoRisk, supplyChain, procurement);
    const executive = this.executiveBriefingAgent.run(geoRisk, supplyChain, procurement, spr, context.reportType);

    return {
      runId: `agent-run-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      context: { requestType: context.requestType, scenario: context.scenario, reportType: context.reportType },
      geoRisk,
      supplyChain,
      procurement,
      spr,
      executive
    };
  }

  ingestNews(title: string, content: string, source: string): Article {
    const articleShell = { title, content, source };
    const run = this.run({ requestType: "news", newsArticle: articleShell });
    const article: Article = {
      id: `art-${Date.now()}`,
      title,
      source,
      publishedAt: new Date().toISOString(),
      content,
      analyzed: true,
      analysis: run.geoRisk.newsAnalysis
    };

    const articles = db.get("articles");
    articles.unshift(article);
    if (articles.length > 50) articles.pop();
    db.update("articles", articles);
    updateGraphFromNewsArticle(article);
    this.applyRiskScores(run.geoRisk.regionalRisks);
    this.raiseAlertFromNews(article);
    return article;
  }

  recalculateRiskScores(): RiskScore[] {
    const run = this.run({ requestType: "risk" });
    const updated = db.get("riskScores").map(score => {
      const agentScore = run.geoRisk.regionalRisks.find(item => item.id === score.id);
      if (!agentScore) return score;
      return { ...score, score: agentScore.score, trend: agentScore.trend, lastUpdated: new Date().toISOString() };
    });
    db.update("riskScores", updated);
    return updated;
  }

  private buildContext(input: Partial<AgentContext>): AgentContext {
    const government = getCachedGovernmentData();
    return {
      requestType: input.requestType ?? "briefing",
      newsArticle: input.newsArticle,
      scenario: input.scenario,
      message: input.message,
      reportType: input.reportType,
      graph: buildKnowledgeGraph(),
      riskScores: db.get("riskScores"),
      commodities: getCachedCommodities(),
      ships: getCachedShips(),
      weather: getCachedWeather(),
      spr: government.spr,
      suppliers: rankSuppliers()
    };
  }

  private applyRiskScores(regionalRisks: AgentRunResult["geoRisk"]["regionalRisks"]) {
    const current = db.get("riskScores");
    const updated = current.map(score => {
      const next = regionalRisks.find(item => item.id === score.id);
      return next ? { ...score, score: next.score, trend: next.trend, lastUpdated: new Date().toISOString() } : score;
    });
    db.update("riskScores", updated);
  }

  private raiseAlertFromNews(article: Article) {
    const analysis = article.analysis;
    if (!analysis || (analysis.priority !== "high" && analysis.priority !== "critical")) return;
    const alerts = db.get("alerts");
    alerts.unshift({
      id: `alert-${Date.now()}`,
      type: "security",
      title: `Threat Flagged: ${analysis.location}`,
      message: analysis.oneSentenceSummary,
      severity: analysis.priority === "critical" ? "critical" : "warning",
      timestamp: new Date().toISOString(),
      acknowledged: false,
      nodeId: analysis.location.toLowerCase().includes("hormuz") ? "hormuz" : analysis.location.toLowerCase().includes("bab") ? "bab" : undefined
    });
    db.update("alerts", alerts);
  }
}

export const agentOrchestrator = new AgentOrchestrator();
