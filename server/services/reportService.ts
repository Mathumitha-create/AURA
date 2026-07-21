import { db } from "../db";
import type { ReportMeta } from "../models/aggregation";
import { getCachedGovernmentData } from "../providers/governmentDataProvider";
import { rankSuppliers } from "./marketService";
import { agentOrchestrator } from "../agents";

export function listReports(): ReportMeta[] {
  return [
    { id: "rep-01", type: "Daily Briefing", title: "Daily Energy Security Briefing", date: new Date().toLocaleDateString() },
    { id: "rep-02", type: "Threat Dossier", title: "Maritime Disruption Risk Matrix", date: new Date(Date.now() - 86400000).toLocaleDateString() },
    { id: "rep-03", type: "Minister Briefing", title: "AURA Executive Summary for Ministry Review", date: new Date(Date.now() - 86400000 * 3).toLocaleDateString() }
  ];
}

export function generateReport(reportType = "Daily Briefing"): Required<ReportMeta> {
  const riskScores = db.get("riskScores");
  const alerts = db.get("alerts");
  const government = getCachedGovernmentData();
  const { ranked } = rankSuppliers();
  const topSupplier = ranked[0];
  const agentRun = agentOrchestrator.run({ requestType: "briefing", reportType });

  let markdownReport = `# AURA Executive Intelligence Briefing\n`;
  markdownReport += `Date: ${new Date().toLocaleDateString()} | Node: SECURE_09 | Classification: SECRET // REL IND\n\n`;
  markdownReport += `## 1. Executive Summary\n`;

  if (reportType === "Minister Briefing") {
    markdownReport += `This briefing highlights the high-priority risk shifts across key chokepoints. Strategic routing is calibrated against current maritime and reserve telemetry.\n\n`;
  } else {
    markdownReport += `Daily tracking operations show refinery utilization at ${government.refineryUtilizationPercent}% with maritime and commodity risk signals under active monitoring.\n\n`;
  }

  markdownReport += `## 2. Threat Index Breakdown\n`;
  riskScores.forEach(r => {
    markdownReport += `- **${r.name}**: Index ${r.score}/100 (Trend: ${r.trend.toUpperCase()}) - ${r.details}\n`;
  });

  markdownReport += `\n## 3. Active Incident Logs\n`;
  alerts.filter(a => !a.acknowledged).forEach(a => {
    markdownReport += `- [${a.severity.toUpperCase()}] ${a.title}: ${a.message} (${new Date(a.timestamp).toLocaleTimeString()})\n`;
  });

  markdownReport += `\n## 4. Strategic Directives\n`;
  markdownReport += `1. Prioritize ${topSupplier.country} spot sourcing for ${topSupplier.type} at $${topSupplier.basePrice}/bbl.\n`;
  markdownReport += `2. Preserve SPR cover at ${government.spr.coverageDays} days unless Persian Gulf throughput degrades.\n`;

  return {
    id: `rep-${Date.now().toString().slice(-4)}`,
    type: reportType,
    title: `${reportType} Report Generated`,
    date: new Date().toLocaleDateString(),
    content: markdownReport
  };
}
