import { db, Article } from "./db";
import { agentOrchestrator } from "./agents";

export interface CopilotResponse {
  situation: string;
  impact: string;
  recommendedActions: string[];
  financialImpact: string;
  confidence: number;
  sources: string[];
  agentRun?: ReturnType<typeof agentOrchestrator.run>;
}

function queryKnowledgeBase(question: string): Article[] {
  const articles = db.get("articles");
  const terms = question.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  if (terms.length === 0) return articles.slice(0, 3);
  return articles
    .map(art => {
      const searchArea = `${art.title} ${art.content} ${art.analysis?.location || ""} ${art.analysis?.threat || ""}`.toLowerCase();
      return { art, score: terms.reduce((sum, term) => sum + (searchArea.includes(term) ? 1 : 0), 0) };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.art)
    .slice(0, 3);
}

export async function queryAuraCopilot(question: string): Promise<CopilotResponse> {
  const relevantDocs = queryKnowledgeBase(question);
  const run = agentOrchestrator.run({ requestType: "copilot", message: question });
  return {
    situation: run.executive.executiveSummary,
    impact: `${run.executive.riskAssessment} Supply chain delta: ${run.supplyChain.transitTime.deltaDays} days. SPR remaining coverage: ${run.spr.remainingDays} days.`,
    recommendedActions: run.executive.actionPlan,
    financialImpact: `Recommended delivered procurement cost: $${run.procurement.cost.totalDeliveredCost.toLocaleString()} ${run.procurement.cost.currency}; composite risk ${run.procurement.risk.compositeRisk}/100.`,
    confidence: run.executive.confidence,
    sources: relevantDocs.length ? relevantDocs.map(doc => doc.source) : ["AURA Knowledge Graph", "Agent Orchestrator"],
    agentRun: run
  };
}
