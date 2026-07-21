import { GoogleGenAI } from "@google/genai";
import { db, Article, RiskScore, Alert } from "./db";

// Initialize Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const settings = db.get("settings");
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;

  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

/**
 * News Intelligence Agent
 * Parses news raw texts into structured security insights via Gemini.
 */
export async function analyzeNewsArticle(title: string, content: string, source: string): Promise<Article> {
  const ai = getGeminiClient();
  const id = `art-${Date.now()}`;
  const publishedAt = new Date().toISOString();

  let analysis: Article['analysis'];

  if (ai) {
    try {
      const prompt = `Ingest this news report and output a structured JSON analysis matching this TypeScript schema:
{
  location: string; // The physical location / strait / port / country affected
  threat: string; // Brief description of threat (e.g. blockade, drone strike, storm)
  country: string; // Primary country involved
  companies: string[]; // Companies or organizations affected
  oilImpact: string; // Practical logistical impact on crude oil routing or pricing
  confidence: number; // Confidence level (0-100)
  priority: 'low' | 'medium' | 'high' | 'critical';
  oneSentenceSummary: string; // One concise sentence summarizing the security event
  riskScoreDelta: number; // Intended increase/decrease to the regional risk score (range -20 to +20)
}

Report to analyze:
Title: ${title}
Source: ${source}
Content: ${content}

Return ONLY the raw JSON string matching the structure above. Do not include markdown code block syntax.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });

      const cleanJson = response.text ? response.text.trim().replace(/^```json|```$/g, '') : '{}';
      analysis = JSON.parse(cleanJson);
    } catch (e) {
      console.warn("Gemini News Agent failed, falling back to local heuristic analysis:", e);
      analysis = runLocalHeuristicAnalysis(title, content);
    }
  } else {
    analysis = runLocalHeuristicAnalysis(title, content);
  }

  const newArticle: Article = {
    id,
    title,
    source,
    publishedAt,
    content,
    analyzed: true,
    analysis
  };

  // Save to DB
  const articles = db.get("articles");
  articles.unshift(newArticle);
  if (articles.length > 50) articles.pop();
  db.update("articles", articles);

  // Apply risk score delta to relevant region
  if (analysis) {
    updateRegionRiskScore(analysis.location, analysis.riskScoreDelta);
    // Create Alert if priority is high or critical
    if (analysis.priority === 'high' || analysis.priority === 'critical') {
      triggerSecurityAlert(analysis.location, analysis.oneSentenceSummary, analysis.priority === 'critical' ? 'critical' : 'warning');
    }
  }

  return newArticle;
}

function runLocalHeuristicAnalysis(title: string, content: string): Article['analysis'] {
  const combined = (title + " " + content).toLowerCase();
  let location = "Global Oil Market";
  let threat = "Market volatility and supply constraints";
  let country = "OPEC";
  let companies: string[] = ["Saudi Aramco"];
  let oilImpact = "Increased crude acquisition costs for Indian refineries.";
  let confidence = 85;
  let priority: Article['analysis']['priority'] = 'medium';
  let oneSentenceSummary = title;
  let riskScoreDelta = 5;

  if (combined.includes("hormuz") || combined.includes("iran")) {
    location = "Strait of Hormuz";
    threat = "Naval maneuvers, blockade threat, or military friction";
    country = "Iran";
    companies = ["National Iranian Oil Company", "IRGC Navy"];
    oilImpact = "Severe route diversions around Cape of Good Hope; cargo delays of 10-14 days.";
    priority = "high";
    riskScoreDelta = 10;
    oneSentenceSummary = "Escalated geopolitical tension near the Strait of Hormuz flags high risk for Persian Gulf oil transit.";
  } else if (combined.includes("red sea") || combined.includes("bab-el-mandeb") || combined.includes("yemen")) {
    location = "Bab-el-Mandeb Strait";
    threat = "Unmanned aerial drone deployment or missile strikes";
    country = "Yemen";
    companies = ["Red Sea Transit Joint Command"];
    oilImpact = "Tankers rerouting south of Africa, increasing spot pricing and freight charges.";
    priority = "critical";
    riskScoreDelta = 15;
    oneSentenceSummary = "Drone activity in the Red Sea forces vessel diversions, disrupting Suez Canal shipping lanes.";
  } else if (combined.includes("suez")) {
    location = "Suez Canal";
    threat = "Transit bottleneck / vessel delay";
    country = "Egypt";
    companies = ["Suez Canal Authority"];
    oilImpact = "Increased backlog of tankers entering the Mediterranean.";
    priority = "medium";
    riskScoreDelta = 4;
  } else if (combined.includes("cyclone") || combined.includes("storm") || combined.includes("weather")) {
    location = "Bay of Bengal / West Coast ports";
    threat = "Extreme weather disruption to ports and single-buoy moorings";
    country = "India";
    companies = ["Indian Oil Corporation", "Reliance Industries"];
    oilImpact = "Refinery crude unloading delayed by 3-5 days due to high swells.";
    priority = "high";
    riskScoreDelta = 8;
    oneSentenceSummary = "Severe weather conditions disrupt offshore offloading at key Indian ports.";
  }

  return {
    location,
    threat,
    country,
    companies,
    oilImpact,
    confidence,
    priority,
    oneSentenceSummary,
    riskScoreDelta
  };
}

function updateRegionRiskScore(location: string, delta: number) {
  const scores = db.get("riskScores");
  let found = false;

  const updated = scores.map(s => {
    // Match location with risk score region
    if (location.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(location.toLowerCase())) {
      found = true;
      const newScore = Math.max(0, Math.min(100, s.score + delta));
      return {
        ...s,
        score: newScore,
        trend: delta > 0 ? 'up' as const : delta < 0 ? 'down' as const : 'stable' as const,
        lastUpdated: new Date().toISOString()
      };
    }
    return s;
  });

  if (found) {
    db.update("riskScores", updated);
    db.logAction("AURA_SYSTEM", "GRID DEFENSE ANALYST", "RISK_SCORE_UPDATED", `Updated risk index for ${location} by delta of ${delta}`);
  }
}

function triggerSecurityAlert(location: string, message: string, severity: 'warning' | 'critical') {
  const alerts = db.get("alerts");
  const newAlert: Alert = {
    id: `alert-${Date.now()}`,
    type: 'security',
    title: `Threat Flagged: ${location}`,
    message,
    severity,
    timestamp: new Date().toISOString(),
    acknowledged: false,
    nodeId: location.toLowerCase().includes("hormuz") ? "hormuz" : location.toLowerCase().includes("bab") ? "bab" : undefined
  };

  alerts.unshift(newAlert);
  db.update("alerts", alerts);
}

/**
 * GeoRisk Agent
 * Assesses threat matrices and assigns regional risk indices.
 */
export async function recalculateGeopoliticalRisk(): Promise<RiskScore[]> {
  const ai = getGeminiClient();
  const scores = db.get("riskScores");

  if (ai) {
    try {
      const prompt = `Based on the following current risk scores:
${JSON.stringify(scores, null, 2)}

Re-evaluate geopolitical risks (0-100) taking into account simulated crude supply changes, drone activity, or military friction. 
Return only a JSON array of updated score objects containing "id" and the new integer "score" (0-100). Do not write anything else.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const cleanJson = response.text ? response.text.trim().replace(/^```json|```$/g, '') : '[]';
      const updates = JSON.parse(cleanJson);

      const updatedScores = scores.map(s => {
        const item = updates.find((u: any) => u.id === s.id);
        if (item) {
          const oldScore = s.score;
          return {
            ...s,
            score: item.score,
            trend: item.score > oldScore ? 'up' as const : item.score < oldScore ? 'down' as const : 'stable' as const,
            lastUpdated: new Date().toISOString()
          };
        }
        return s;
      });

      db.update("riskScores", updatedScores);
      return updatedScores;
    } catch (e) {
      console.warn("Gemini GeoRisk Agent failed, returning current scores:", e);
    }
  }

  return scores;
}

/**
 * Scenario Agent
 * Simulates multivariable disruption impacts.
 */
export interface SimulationResult {
  disruptionType: string;
  percent: number;
  oilImportDropPercent: number;
  brentPriceSpike: number;
  indiaGdpDragPercent: number;
  refineryUtilizationPercent: number;
  powerSectorLossPercent: number;
  importCostIncreaseBillions: number;
  sprDrawdownRecommendationDays: number;
  executiveSummary: string;
}

export async function simulateDisruption(type: string, percent: number): Promise<SimulationResult> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Simulate an energy disruption event in India's oil supply chain:
Disruption Event: ${type}
Severity: ${percent}%

Calculate:
1. Oil import reduction percentage
2. Brent Crude price spike ($/bbl deviation)
3. GDP Growth drag (negative % impact)
4. Indian refinery utilization level (%)
5. Power grid capacity drop (%)
6. Net import cost increase (billion USD)
7. Recomended Strategic Petroleum Reserve release volume (in days of coverage)
8. A professional, brief, Palantir-gotham style strategic executive summary.

Return a JSON object conforming exactly to this structure:
{
  disruptionType: string,
  percent: number,
  oilImportDropPercent: number,
  brentPriceSpike: number,
  indiaGdpDragPercent: number,
  refineryUtilizationPercent: number,
  powerSectorLossPercent: number,
  importCostIncreaseBillions: number,
  sprDrawdownRecommendationDays: number,
  executiveSummary: string
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const cleanJson = response.text ? response.text.trim().replace(/^```json|```$/g, '') : '{}';
      return JSON.parse(cleanJson);
    } catch (e) {
      console.warn("Gemini Scenario Agent failed, falling back to local simulation logic:", e);
    }
  }

  // Local Simulation Math
  const scale = percent / 100;
  let importDrop = 0;
  let priceSpike = 0;
  let gdpDrag = 0;
  let refUtil = 98;
  let powerLoss = 0;
  let costInc = 0;
  let sprRec = 0;
  let summary = "";

  switch (type) {
    case 'hormuz':
      importDrop = Math.round(65 * scale);
      priceSpike = Math.round(45 * scale);
      gdpDrag = Number((2.8 * scale).toFixed(1));
      refUtil = Math.round(98 - 35 * scale);
      powerLoss = Math.round(15 * scale);
      costInc = Number((24 * scale).toFixed(1));
      sprRec = Math.round(9.5 * scale);
      summary = `CRITICAL ASSESS: A ${percent}% blockade of the Strait of Hormuz disrupts 60% of India's Persian Gulf imports. Rerouting via Cape of Good Hope adds 11 days of freight delay. Recommending immediate SPR cavern drawdowns at Padur/Mangalore and invoking spot deals with West African/US suppliers.`;
      break;
    case 'redsea':
      importDrop = Math.round(35 * scale);
      priceSpike = Math.round(20 * scale);
      gdpDrag = Number((1.2 * scale).toFixed(1));
      refUtil = Math.round(98 - 18 * scale);
      powerLoss = Math.round(5 * scale);
      costInc = Number((9.5 * scale).toFixed(1));
      sprRec = Math.round(4.5 * scale);
      summary = `ALERT: Red Sea threat factors force Suez-bound cargo into African Cape bypass. High shipping insurance premiums ($+$6.50/bbl) drive domestic refining margins down. Immediate sourcing shifts to US Gulf Coast recommended.`;
      break;
    case 'opec':
      importDrop = Math.round(15 * scale);
      priceSpike = Math.round(30 * scale);
      gdpDrag = Number((1.5 * scale).toFixed(1));
      refUtil = Math.round(98 - 5 * scale);
      powerLoss = Math.round(2 * scale);
      costInc = Number((14 * scale).toFixed(1));
      sprRec = Math.round(2 * scale);
      summary = `MARKET WARNING: OPEC+ quota tightening of ${percent}% removes spare supply. Recommending spot market procurement from non-aligned producers (Brazil, Guyana) to bypass OPEC target ranges.`;
      break;
    case 'cyclone':
      importDrop = Math.round(25 * scale);
      priceSpike = Math.round(5 * scale);
      gdpDrag = Number((0.4 * scale).toFixed(1));
      refUtil = Math.round(98 - 25 * scale);
      powerLoss = Math.round(8 * scale);
      costInc = Number((1.8 * scale).toFixed(1));
      sprRec = Math.round(3.0 * scale);
      summary = `METEOROLOGICAL FORCE: Severe weather shuts offshore Single Buoy Moorings (SBMs) at Jamnagar and Vadinar. Crude discharge delayed. Recommending coastal distribution rebalancing.`;
      break;
    default:
      importDrop = Math.round(10 * scale);
      priceSpike = Math.round(8 * scale);
      gdpDrag = Number((0.5 * scale).toFixed(1));
      refUtil = Math.round(98 - 10 * scale);
      summary = "Generic geopolitical risk vector simulated. Local contingency protocols standby.";
  }

  return {
    disruptionType: type,
    percent,
    oilImportDropPercent: importDrop,
    brentPriceSpike: priceSpike,
    indiaGdpDragPercent: gdpDrag,
    refineryUtilizationPercent: refUtil,
    powerSectorLossPercent: powerLoss,
    importCostIncreaseBillions: costInc,
    sprDrawdownRecommendationDays: sprRec,
    executiveSummary: summary
  };
}
