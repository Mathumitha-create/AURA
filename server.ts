import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { db } from "./server/db";
import { analyzeNewsArticle, recalculateGeopoliticalRisk, simulateDisruption } from "./server/agents";
import { queryAuraCopilot } from "./server/rag";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// 1. News Feed endpoints
app.get("/api/news", (req, res) => {
  res.json(db.get("articles"));
});

app.post("/api/news/ingest", async (req, res) => {
  try {
    const { title, content, source } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }
    const newArticle = await analyzeNewsArticle(title, content, source || "Manual Ingestion");
    res.status(201).json(newArticle);
  } catch (error: any) {
    console.error("News Ingestion Error:", error);
    res.status(500).json({ error: error.message || "Failed to ingest news article." });
  }
});

// 2. GeoRisk endpoints
app.get("/api/georisk", (req, res) => {
  res.json(db.get("riskScores"));
});

app.post("/api/georisk/evaluate", async (req, res) => {
  try {
    const updatedScores = await recalculateGeopoliticalRisk();
    res.json(updatedScores);
  } catch (error: any) {
    console.error("GeoRisk Evaluation Error:", error);
    res.status(500).json({ error: "Failed to recalculate risks." });
  }
});

// 3. Scenario Lab simulation endpoint
app.post("/api/scenario/simulate", async (req, res) => {
  try {
    const { type, percent } = req.body;
    if (!type || percent === undefined) {
      return res.status(400).json({ error: "Disruption type and severity percentage are required." });
    }
    const result = await simulateDisruption(type, Number(percent));
    
    // Log the user action
    const settings = db.get("settings");
    db.logAction(
      "operator_alpha", 
      settings.activeRole, 
      "SCENARIO_SIMULATION_RUN", 
      `Simulated ${type} disruption at ${percent}% severity`
    );

    res.json(result);
  } catch (error: any) {
    console.error("Scenario Simulation Error:", error);
    res.status(500).json({ error: "Failed to run simulation model." });
  }
});

// 4. Procurement Orchestrator endpoint
app.post("/api/procurement/rank", (req, res) => {
  try {
    const { disruptionType, severityPercent } = req.body;
    
    // Evaluate alternative suppliers based on current risk scores
    const riskScores = db.get("riskScores");
    const getRisk = (name: string) => riskScores.find(r => r.name.toLowerCase().includes(name.toLowerCase()))?.score || 30;
    
    // Live-calc supplier compatibility scores
    const suppliers = [
      { country: "Nigeria", type: "Bonny Light (Sweet)", basePrice: 83.50, transitDays: 18, risk: getRisk("Nigeria"), congestion: 20 },
      { country: "United States", type: "WTI Crude (Light/Sweet)", basePrice: 79.80, transitDays: 22, risk: getRisk("United States"), congestion: 15 },
      { country: "Saudi Arabia", type: "Arab Light (Medium/Sour)", basePrice: 85.20, transitDays: 5, risk: getRisk("Saudi Arabia"), congestion: 40 },
      { country: "UAE", type: "Murban (Light/Sweet)", basePrice: 84.10, transitDays: 4, risk: getRisk("UAE"), congestion: 30 },
      { country: "Russia", type: "Urals (Medium/Sour)", basePrice: 72.50, transitDays: 25, risk: getRisk("Russia"), congestion: 50 },
      { country: "Brazil", type: "Lula (Medium)", basePrice: 81.20, transitDays: 20, risk: getRisk("Brazil"), congestion: 10 }
    ];

    const ranked = suppliers.map(s => {
      // Compatibility math (High compatibility = low pricing, low transit days, low risk and congestion)
      const priceFactor = (100 - s.basePrice) * 0.3;
      const transitFactor = (30 - s.transitDays) * 0.25;
      const riskFactor = (100 - s.risk) * 0.3;
      const congestionFactor = (60 - s.congestion) * 0.15;
      const score = Math.round(Math.max(10, Math.min(99, priceFactor + transitFactor + riskFactor + congestionFactor + 30)));
      
      return {
        ...s,
        score
      };
    }).sort((a, b) => b.score - a.score);

    const top = ranked[0];

    // Generate PO structure
    const po = {
      purchaseOrderId: `AURA-PO-${Date.now().toString().slice(-6)}`,
      supplier: top.country,
      crudeType: top.type,
      volumeBarrels: 2000000,
      basePricePerBarrel: top.basePrice,
      estimatedShippingCost: top.transitDays * 12000,
      etaDays: top.transitDays,
      savingsVsBrent: Math.round((87.00 - top.basePrice) * 2000000 - (top.transitDays * 12000)),
      summary: `PRO-RECOMMEND: Selected ${top.country} for immediate delivery of 2M barrels of ${top.type}. Offering compatibility rating of ${top.score}% due to optimized risk discount (${top.risk} index) and Spot price of $${top.basePrice}/bbl. Logistics routing secures ETA in ${top.transitDays} days bypassing high-risk chokepoint hubs.`
    };

    // Log the user action
    const settings = db.get("settings");
    db.logAction("operator_alpha", settings.activeRole, "PROCUREMENT_STRATEGY_GENERATED", `Generated sourcing ranking for top country: ${top.country}`);

    res.json({ ranked, po });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to rank procurement paths." });
  }
});

// 5. SPR Cavern Manager endpoint
app.get("/api/spr", (req, res) => {
  const caverns = [
    { name: "Padur Caverns (Karnataka)", capacityMillionBbl: 18.0, currentStockMillionBbl: 16.5, fillPercent: 91.6, fillStatus: "secure" },
    { name: "Mangalore Caverns (Karnataka)", capacityMillionBbl: 11.0, currentStockMillionBbl: 9.8, fillPercent: 89.0, fillStatus: "secure" },
    { name: "Visakhapatnam Caverns (AP)", capacityMillionBbl: 10.0, currentStockMillionBbl: 8.5, fillPercent: 85.0, fillStatus: "stable" }
  ];

  const totalCapacity = 39.0;
  const totalStock = 34.8;
  const coverageDays = 9.5; // days of net import cover

  res.json({ caverns, totalCapacity, totalStock, coverageDays });
});

// 6. RAG-based AI Copilot endpoint
app.post("/api/copilot", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message query is required." });
    }

    const response = await queryAuraCopilot(message);
    res.json(response);
  } catch (error: any) {
    console.error("Gemini Copilot Error:", error);
    res.status(500).json({ error: "Failed to query AURA Neural Node." });
  }
});

// 7. Reports list and generation
app.get("/api/reports", (req, res) => {
  const reportsList = [
    { id: "rep-01", type: "Daily Briefing", title: "Daily Energy Security Briefing", date: new Date().toLocaleDateString() },
    { id: "rep-02", type: "Threat Dossier", title: "Maritime Disruption Risk Matrix", date: new Date(Date.now() - 86400000).toLocaleDateString() },
    { id: "rep-03", type: "Minister Briefing", title: "AURA Executive Summary for Ministry Review", date: new Date(Date.now() - 86400000 * 3).toLocaleDateString() }
  ];
  res.json(reportsList);
});

app.post("/api/reports/generate", (req, res) => {
  const { reportType } = req.body;
  const riskScores = db.get("riskScores");
  const alerts = db.get("alerts");

  let markdownReport = `# AURA Executive Intelligence Briefing\n`;
  markdownReport += `Date: ${new Date().toLocaleDateString()} | Node: SECURE_09 | Classification: SECRET // REL IND\n\n`;
  markdownReport += `## 1. Executive Summary\n`;

  if (reportType === "Minister Briefing") {
    markdownReport += `This briefing highlights the high-priority risk shifts across key chokepoints. Strait of Hormuz threat factors have peaked at score 85. Alternative logistics channels via the Cape of Good Hope are fully monitored and cleared.\n\n`;
  } else {
    markdownReport += `Daily tracking operations show stable domestic refining (98% utilization) with elevated maritime insurance premiums affecting Suez route transits.\n\n`;
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
  markdownReport += `1. Support spot arbitrage trading targeting US WTI and Brazilian Lula crude.\n`;
  markdownReport += `2. Authorize partial drawdowns at Padur if Persian Gulf shipping drops below 25% throughput.\n`;

  const reportObject = {
    id: `rep-${Date.now().toString().slice(-4)}`,
    type: reportType || "Daily Briefing",
    title: `${reportType || "Daily"} Report Generated`,
    date: new Date().toLocaleDateString(),
    content: markdownReport
  };

  res.status(201).json(reportObject);
});

// 8. Audit logs and Settings CRUD
app.get("/api/audit", (req, res) => {
  res.json(db.get("auditLogs"));
});

app.get("/api/settings", (req, res) => {
  res.json(db.get("settings"));
});

app.post("/api/settings", (req, res) => {
  try {
    const updated = req.body;
    const current = db.get("settings");
    const next = { ...current, ...updated };
    db.update("settings", next);
    
    // Log role modifications
    if (updated.activeRole && updated.activeRole !== current.activeRole) {
      db.logAction("admin_nexus", "NEXUS COMMANDER", "ROLE_MODIFICATION", `Swapped active command permission group to ${updated.activeRole}`);
    } else {
      db.logAction("admin_nexus", "NEXUS COMMANDER", "SETTINGS_UPDATED", "Modified sensor telemetry profiles and notification channels");
    }

    res.json(next);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update configurations." });
  }
});

// Serve static app
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AURA Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();

