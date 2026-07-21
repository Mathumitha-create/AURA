import type { Article } from "../db";
import type { AgentContext, GeoRiskOutput } from "./types";

const maritimeTerms = ["hormuz", "bab-el-mandeb", "red sea", "suez", "tanker", "vessel", "naval", "drone", "missile", "piracy", "blockade"];
const conflictTerms = ["attack", "war", "conflict", "military", "patrol", "strike", "rebel", "guard", "harassment", "boardings"];
const sanctionTerms = ["sanction", "embargo", "quota", "export control", "price cap", "opec", "russia", "iran"];

export class GeoRiskAgent {
  public readonly name = "GeoRisk Agent" as const;

  run(context: AgentContext): GeoRiskOutput {
    const text = `${context.newsArticle?.title || ""} ${context.newsArticle?.content || ""} ${context.message || ""}`.toLowerCase();
    const graphRisks = context.graph.nodes
      .filter(node => ["Country", "Port", "Organization", "News Event"].includes(node.type))
      .sort((a, b) => b.riskScore - a.riskScore);

    const matchedRegions = graphRisks
      .filter(node => text.includes(node.label.toLowerCase()) || node.riskScore >= 70)
      .slice(0, 5);

    const maritimeHits = maritimeTerms.filter(term => text.includes(term));
    const conflictHits = conflictTerms.filter(term => text.includes(term));
    const sanctionHits = sanctionTerms.filter(term => text.includes(term));
    const inputRisk = maritimeHits.length * 6 + conflictHits.length * 7 + sanctionHits.length * 5;
    const graphRisk = Math.round(matchedRegions.reduce((sum, node) => sum + node.riskScore, 0) / Math.max(matchedRegions.length, 1)) || 45;
    const scenarioPressure = context.scenario ? Math.round(context.scenario.percent * 0.35) : 0;
    const riskScore = clamp(Math.round(graphRisk * 0.62 + inputRisk + scenarioPressure), 0, 100);
    const confidence = clamp(72 + matchedRegions.length * 4 + Math.min(12, maritimeHits.length * 2), 55, 97);
    const affectedRegions = matchedRegions.length ? matchedRegions.map(node => node.label) : inferAffectedRegions(text, context);

    return {
      agent: this.name,
      riskScore,
      affectedRegions,
      confidence,
      sanctions: sanctionHits.map(term => ({ region: affectedRegions[0] || "Global Oil Market", severity: clamp(45 + riskScore * 0.4, 0, 100), evidence: term })),
      conflicts: conflictHits.map(term => ({ region: affectedRegions[0] || "Global Oil Market", severity: clamp(50 + riskScore * 0.45, 0, 100), evidence: term })),
      maritimeSecurity: maritimeHits.map(term => ({ chokepoint: inferChokepoint(term), severity: clamp(48 + riskScore * 0.45, 0, 100), evidence: term })),
      regionalRisks: context.riskScores.map(score => {
        const affected = affectedRegions.some(region => region.toLowerCase().includes(score.name.toLowerCase()) || score.name.toLowerCase().includes(region.toLowerCase()));
        const nextScore = affected ? clamp(Math.round(score.score * 0.55 + riskScore * 0.45), 0, 100) : score.score;
        return {
          id: score.id,
          name: score.name,
          score: nextScore,
          trend: nextScore > score.score ? "up" as const : nextScore < score.score ? "down" as const : "stable" as const,
          confidence
        };
      }),
      newsAnalysis: context.newsArticle ? this.toNewsAnalysis(context, riskScore, affectedRegions, confidence, maritimeHits, conflictHits, sanctionHits) : undefined
    };
  }

  private toNewsAnalysis(
    context: AgentContext,
    riskScore: number,
    affectedRegions: string[],
    confidence: number,
    maritimeHits: string[],
    conflictHits: string[],
    sanctionHits: string[]
  ): Article["analysis"] {
    const location = affectedRegions[0] || "Global Oil Market";
    const priority = riskScore >= 80 ? "critical" : riskScore >= 62 ? "high" : riskScore >= 42 ? "medium" : "low";
    const companies = context.graph.nodes
      .filter(node => node.type === "Organization" && (`${context.newsArticle?.title} ${context.newsArticle?.content}`).toLowerCase().includes(node.label.toLowerCase()))
      .map(node => node.label)
      .slice(0, 4);
    return {
      location,
      threat: [...conflictHits, ...maritimeHits, ...sanctionHits].slice(0, 4).join(", ") || "Supply chain risk signal",
      country: inferCountry(location, context),
      companies: companies.length ? companies : ["AURA Knowledge Graph"],
      oilImpact: `Graph-linked risk score ${riskScore}/100 affecting ${location} and connected crude logistics.`,
      confidence,
      priority,
      oneSentenceSummary: `${context.newsArticle?.title} raises ${priority} risk for ${location}.`,
      riskScoreDelta: Math.round((riskScore - 50) / 5)
    };
  }
}

function inferAffectedRegions(text: string, context: AgentContext) {
  if (text.includes("hormuz") || text.includes("iran")) return ["Strait of Hormuz", "Iran"];
  if (text.includes("red sea") || text.includes("bab-el-mandeb") || text.includes("yemen")) return ["Bab-el-Mandeb Strait"];
  if (text.includes("suez")) return ["Suez Canal"];
  if (text.includes("cyclone") || text.includes("storm") || text.includes("weather")) return ["Arabian Sea", "Jamnagar Sikka Port"];
  return context.riskScores.sort((a, b) => b.score - a.score).slice(0, 2).map(score => score.name);
}

function inferChokepoint(term: string) {
  if (term.includes("hormuz")) return "Strait of Hormuz";
  if (term.includes("red") || term.includes("bab")) return "Bab-el-Mandeb Strait";
  if (term.includes("suez")) return "Suez Canal";
  return "Maritime Security Corridor";
}

function inferCountry(location: string, context: AgentContext) {
  const lower = `${location} ${context.newsArticle?.title || ""} ${context.newsArticle?.content || ""}`.toLowerCase();
  if (lower.includes("iran") || lower.includes("hormuz")) return "Iran";
  if (lower.includes("yemen") || lower.includes("bab")) return "Yemen / Red Sea Corridor";
  if (lower.includes("india") || lower.includes("jamnagar")) return "India";
  return "Global Oil Market";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
