import type { Article } from "../db";
import { db } from "../db";
import type { GraphEdge, GraphEdgeType, GraphNode, GraphNodeType, GraphPathResult, GraphRiskResult, KnowledgeGraph } from "../models/graph";
import { logger } from "../utils/logger";

const now = () => new Date().toISOString();
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function statusFromRisk(score: number): GraphNode["status"] {
  if (score >= 75) return "critical";
  if (score >= 50) return "warning";
  if (score >= 30) return "watch";
  return "nominal";
}

function node(id: string, type: GraphNodeType, label: string, riskScore: number, summary: string, metadata: GraphNode["metadata"] = {}): GraphNode {
  return { id, type, label, riskScore, status: statusFromRisk(riskScore), summary, metadata, updatedAt: now() };
}

function edge(source: string, target: string, type: GraphEdgeType, weight: number, riskScore: number, evidence: string): GraphEdge {
  return { id: `${source}:${type}:${target}`, source, target, type, weight, riskScore, evidence, updatedAt: now() };
}

function mergeNode(nodes: Map<string, GraphNode>, next: GraphNode) {
  const existing = nodes.get(next.id);
  if (!existing) {
    nodes.set(next.id, next);
    return;
  }
  const riskScore = Math.max(existing.riskScore, next.riskScore);
  nodes.set(next.id, {
    ...existing,
    ...next,
    riskScore,
    status: statusFromRisk(riskScore),
    metadata: { ...existing.metadata, ...next.metadata }
  });
}

function mergeEdge(edges: Map<string, GraphEdge>, next: GraphEdge) {
  const existing = edges.get(next.id);
  if (!existing || next.riskScore >= existing.riskScore) edges.set(next.id, next);
}

export function buildKnowledgeGraph(): KnowledgeGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const addNode = (next: GraphNode) => mergeNode(nodes, next);
  const addEdge = (next: GraphEdge) => mergeEdge(edges, next);

  const riskScores = db.get("riskScores");
  const risk = (name: string, fallback: number) => riskScores.find(item => item.name.toLowerCase().includes(name.toLowerCase()))?.score ?? fallback;

  const seedNodes: GraphNode[] = [
    node("country-india", "Country", "India", 28, "Primary importing nation and downstream fuel demand center.", { importDependencyPercent: 88 }),
    node("country-iran", "Country", "Iran", risk("Iran", 82), "Geopolitical actor affecting Persian Gulf maritime security."),
    node("country-saudi-arabia", "Country", "Saudi Arabia", risk("Saudi", 35), "Core crude supplier with pipeline bypass optionality."),
    node("country-nigeria", "Country", "Nigeria", risk("Nigeria", 45), "West African alternate crude sourcing country."),
    node("country-united-states", "Country", "United States", risk("United States", 20), "WTI alternate supplier and market stabilizer."),
    node("supplier-saudi-aramco", "Supplier", "Saudi Aramco", 34, "Supplier of Arab Light crude to Indian refineries."),
    node("supplier-nnpc", "Supplier", "NNPC / Bonny Light", 42, "Supplier of Bonny Light crude for alternate sourcing."),
    node("supplier-us-gulf", "Supplier", "US Gulf Suppliers", 22, "WTI-linked emergency alternate crude channel."),
    node("oilfield-ghawar", "Oil Field", "Ghawar Oil Field", 26, "Saudi upstream crude field feeding export terminals."),
    node("oilfield-bonny", "Oil Field", "Bonny Light Fields", 38, "Nigerian sweet crude fields connected to Bonny export flows."),
    node("port-ras-tanura", "Port", "Ras Tanura Terminal", 34, "Saudi export terminal connected to Persian Gulf routes."),
    node("port-bonny", "Port", "Bonny Island Port", 42, "Nigerian export port for Bonny Light cargoes."),
    node("port-jamnagar", "Port", "Jamnagar Sikka Port", 24, "Western India crude intake port."),
    node("port-mumbai", "Port", "Mumbai Port Crude Terminal", 28, "Mumbai refinery crude terminal."),
    node("chokepoint-hormuz", "Port", "Strait of Hormuz", risk("Hormuz", 85), "Critical maritime chokepoint for Persian Gulf oil flows."),
    node("chokepoint-bab-el-mandeb", "Port", "Bab-el-Mandeb Strait", risk("Bab", 78), "Red Sea chokepoint exposed to drone and missile risk."),
    node("tanker-desh-vishal", "Tanker", "MT Desh Vishal", 18, "VLCC carrying crude toward Jamnagar."),
    node("tanker-swarna-kamal", "Tanker", "MT Swarna Kamal", 22, "Suezmax tanker carrying Bonny Light toward Mumbai."),
    node("pipeline-east-west", "Pipeline", "Saudi East-West Pipeline", 31, "Pipeline bypass from Gulf fields toward Yanbu."),
    node("refinery-jamnagar", "Refinery", "Jamnagar Refinery", 25, "High-capacity refinery complex producing fuels for Indian demand.", { capacity: "1,240,000 bpd", currentInventory: "85%" }),
    node("refinery-mumbai", "Refinery", "Mumbai Refinery", 30, "Western India refining hub."),
    node("spr-padur", "Strategic Petroleum Reserve", "Padur SPR", 12, "Strategic petroleum reserve cavern in Karnataka."),
    node("spr-mangalore", "Strategic Petroleum Reserve", "Mangalore SPR", 14, "Strategic reserve supporting west coast refineries."),
    node("commodity-brent", "Commodity", "Brent Crude", 44, "Global crude pricing benchmark."),
    node("commodity-arab-light", "Commodity", "Arab Light Crude", 35, "Saudi export crude grade."),
    node("commodity-bonny-light", "Commodity", "Bonny Light Crude", 38, "Nigerian sweet crude grade."),
    node("commodity-diesel", "Commodity", "Diesel Production", 32, "Refinery output essential to transport and industrial demand."),
    node("org-opec", "Organization", "OPEC", risk("OPEC", 55), "Producer organization influencing quota and supply conditions."),
    node("org-indian-fuel-supply", "Organization", "Indian Fuel Supply", 34, "Domestic fuel supply chain dependent on crude imports and refinery throughput."),
    node("org-reliance", "Organization", "Reliance Industries", 24, "Operator of Jamnagar Refinery."),
    node("org-ioc-bpcl-hpcl", "Organization", "IOC / BPCL / HPCL", 29, "Indian public downstream and refining operators.")
  ];

  seedNodes.forEach(addNode);

  [
    edge("country-saudi-arabia", "supplier-saudi-aramco", "exports", 0.8, 35, "Saudi crude export capacity."),
    edge("country-nigeria", "supplier-nnpc", "exports", 0.7, 42, "Bonny Light alternate supply."),
    edge("country-united-states", "supplier-us-gulf", "exports", 0.7, 22, "WTI-linked alternate supply."),
    edge("oilfield-ghawar", "supplier-saudi-aramco", "supplies", 0.8, 28, "Field feeds Saudi export stream."),
    edge("oilfield-bonny", "supplier-nnpc", "supplies", 0.8, 38, "Bonny fields feed export terminal."),
    edge("supplier-saudi-aramco", "commodity-arab-light", "supplies", 0.9, 35, "Arab Light cargo availability."),
    edge("supplier-nnpc", "commodity-bonny-light", "supplies", 0.75, 38, "Bonny Light cargo availability."),
    edge("supplier-saudi-aramco", "port-ras-tanura", "exports", 0.8, 34, "Ras Tanura loading program."),
    edge("supplier-nnpc", "port-bonny", "exports", 0.8, 42, "Bonny Island cargo loading."),
    edge("port-ras-tanura", "chokepoint-hormuz", "connected_to", 0.9, risk("Hormuz", 85), "Persian Gulf exit corridor."),
    edge("chokepoint-hormuz", "tanker-desh-vishal", "travels_to", 0.9, risk("Hormuz", 85), "Tanker route exposure."),
    edge("port-bonny", "tanker-swarna-kamal", "travels_to", 0.7, 34, "West Africa to India cargo movement."),
    edge("tanker-desh-vishal", "port-jamnagar", "travels_to", 0.9, 28, "VLCC destination."),
    edge("tanker-swarna-kamal", "port-mumbai", "travels_to", 0.8, 30, "Suezmax destination."),
    edge("port-jamnagar", "refinery-jamnagar", "connected_to", 0.95, 24, "Port supplies refinery intake."),
    edge("port-mumbai", "refinery-mumbai", "connected_to", 0.9, 28, "Port supplies refinery intake."),
    edge("refinery-jamnagar", "commodity-diesel", "supplies", 0.9, 30, "Refinery output stream."),
    edge("commodity-diesel", "org-indian-fuel-supply", "supplies", 0.9, 34, "Diesel production supports national fuel availability."),
    edge("country-india", "refinery-jamnagar", "imports", 0.8, 28, "India imports crude for refinery operations."),
    edge("country-india", "refinery-mumbai", "imports", 0.8, 30, "India imports crude for refinery operations."),
    edge("commodity-arab-light", "spr-padur", "stored_at", 0.55, 16, "Reserve storage optionality."),
    edge("commodity-bonny-light", "spr-mangalore", "stored_at", 0.5, 16, "Reserve storage optionality."),
    edge("pipeline-east-west", "port-ras-tanura", "connected_to", 0.6, 31, "Saudi crude logistics network."),
    edge("supplier-saudi-aramco", "pipeline-east-west", "owned_by", 0.45, 31, "Operational ownership linkage."),
    edge("org-reliance", "refinery-jamnagar", "owned_by", 0.9, 24, "Operator relationship."),
    edge("org-ioc-bpcl-hpcl", "refinery-mumbai", "owned_by", 0.8, 29, "Operator relationship."),
    edge("org-opec", "commodity-brent", "at_risk_due_to", 0.6, risk("OPEC", 55), "Quota shifts affect benchmark pricing."),
    edge("country-iran", "chokepoint-hormuz", "at_risk_due_to", 0.9, risk("Iran", 82), "Iranian posture places the Hormuz corridor at risk."),
    edge("chokepoint-hormuz", "country-iran", "blocked_by", 0.75, risk("Iran", 82), "Threat scenario driven by Iranian naval posture."),
    edge("chokepoint-hormuz", "country-iran", "at_risk_due_to", 0.9, risk("Iran", 82), "Risk propagation from geopolitical actor.")
  ].forEach(addEdge);

  db.get("articles").forEach(article => addNewsArticleToMaps(article, nodes, edges));

  return { nodes: [...nodes.values()], edges: [...edges.values()], updatedAt: now() };
}

function addNewsArticleToMaps(article: Article, nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>) {
  const analysis = article.analysis;
  const title = article.title || "News Event";
  const riskScore = Math.min(100, Math.max(20, 45 + (analysis?.riskScoreDelta ?? 0) * 3));
  const eventNode = node(`news-${slug(article.id)}`, "News Event", title, riskScore, analysis?.oneSentenceSummary || article.content.slice(0, 160), {
    source: article.source,
    publishedAt: article.publishedAt,
    priority: analysis?.priority || "medium"
  });
  mergeNode(nodes, eventNode);

  const countryLabel = analysis?.country?.split("/")[0].trim() || inferCountry(title + " " + article.content);
  if (countryLabel) {
    const countryNode = node(`country-${slug(countryLabel)}`, "Country", countryLabel, riskScore, `Country entity extracted from ${article.source}.`);
    mergeNode(nodes, countryNode);
    mergeEdge(edges, edge(eventNode.id, countryNode.id, "at_risk_due_to", 0.65, riskScore, `Extracted from news event: ${title}`));
  }

  const locationLabel = analysis?.location || inferLocation(title + " " + article.content);
  if (locationLabel) {
    const locationId = locationLabel.toLowerCase().includes("hormuz") ? "chokepoint-hormuz" : locationLabel.toLowerCase().includes("bab") ? "chokepoint-bab-el-mandeb" : `port-${slug(locationLabel)}`;
    mergeNode(nodes, node(locationId, "Port", locationLabel, riskScore, `Location referenced by news event: ${title}`));
    mergeEdge(edges, edge(locationId, eventNode.id, "at_risk_due_to", 0.85, riskScore, analysis?.threat || title));
    mergeEdge(edges, edge(eventNode.id, "org-indian-fuel-supply", "at_risk_due_to", 0.45, riskScore, analysis?.oilImpact || "Potential oil logistics impact."));
  }

  (analysis?.companies || []).forEach(company => {
    const org = node(`org-${slug(company)}`, "Organization", company, riskScore, `Organization mentioned in ${article.source}.`);
    mergeNode(nodes, org);
    mergeEdge(edges, edge(eventNode.id, org.id, "at_risk_due_to", 0.35, riskScore, `Mentioned in ${title}`));
  });
}

function inferCountry(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("iran")) return "Iran";
  if (lower.includes("yemen")) return "Yemen";
  if (lower.includes("saudi")) return "Saudi Arabia";
  if (lower.includes("india")) return "India";
  return "Global Oil Market";
}

function inferLocation(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("hormuz")) return "Strait of Hormuz";
  if (lower.includes("bab-el-mandeb") || lower.includes("red sea")) return "Bab-el-Mandeb Strait";
  if (lower.includes("suez")) return "Suez Canal";
  if (lower.includes("jamnagar")) return "Jamnagar Sikka Port";
  return "Global Oil Market";
}

export function updateGraphFromNewsArticle(article: Article) {
  const graph = buildKnowledgeGraph();
  logger.info("knowledge graph updated from news", { articleId: article.id, nodes: graph.nodes.length, edges: graph.edges.length });
  return graph;
}

export function getGraphNode(id: string) {
  const graph = buildKnowledgeGraph();
  const node = graph.nodes.find(item => item.id === id);
  if (!node) return null;
  const edges = graph.edges.filter(item => item.source === id || item.target === id);
  const neighborIds = new Set(edges.flatMap(item => [item.source, item.target]).filter(item => item !== id));
  return { node, edges, neighbors: graph.nodes.filter(item => neighborIds.has(item.id)) };
}

export function findGraphPath(from: string, to: string): GraphPathResult | null {
  const graph = buildKnowledgeGraph();
  return runPathSearch(graph, from, to, true) || runPathSearch(graph, from, to, false);
}

function runPathSearch(graph: KnowledgeGraph, from: string, to: string, avoidNewsEvents: boolean): GraphPathResult | null {
  const nodeById = new Map(graph.nodes.map(item => [item.id, item]));
  const adjacency = new Map<string, GraphEdge[]>();
  graph.edges.forEach(item => {
    adjacency.set(item.source, [...(adjacency.get(item.source) || []), item]);
    adjacency.set(item.target, [...(adjacency.get(item.target) || []), { ...item, source: item.target, target: item.source }]);
  });

  const queue: Array<{ id: string; edgePath: GraphEdge[] }> = [{ id: from, edgePath: [] }];
  const visited = new Set<string>([from]);

  while (queue.length) {
    const current = queue.shift()!;
    if (current.id === to) {
      const nodeIds = [from, ...current.edgePath.map(item => item.target)];
      const nodes = nodeIds.map(id => nodeById.get(id)).filter(Boolean) as GraphNode[];
      const edges = current.edgePath;
      return { from, to, nodes, edges, totalRisk: Math.round(edges.reduce((sum, item) => sum + item.riskScore, 0) / Math.max(edges.length, 1)) };
    }

    const nextEdges = (adjacency.get(current.id) || []).sort((a, b) => Number(nodeById.get(a.target)?.type === "News Event") - Number(nodeById.get(b.target)?.type === "News Event"));
    for (const next of nextEdges) {
      if (visited.has(next.target)) continue;
      const nextNode = nodeById.get(next.target);
      if (avoidNewsEvents && next.target !== to && nextNode?.type === "News Event") continue;
      visited.add(next.target);
      queue.push({ id: next.target, edgePath: [...current.edgePath, next] });
    }
  }

  return null;
}

export function calculateGraphRisk(nodeId?: string): GraphRiskResult[] | GraphRiskResult | null {
  const graph = buildKnowledgeGraph();
  const targets = nodeId ? graph.nodes.filter(item => item.id === nodeId) : graph.nodes;
  const results = targets.map(target => {
    const inbound = graph.edges.filter(edge => edge.target === target.id || edge.source === target.id);
    const drivers = inbound
      .map(item => {
        const otherId = item.source === target.id ? item.target : item.source;
        const other = graph.nodes.find(node => node.id === otherId);
        return {
          nodeId: otherId,
          label: other?.label || otherId,
          edgeType: item.type,
          contribution: Math.round(item.riskScore * item.weight),
          evidence: item.evidence
        };
      })
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 6);
    const propagatedRisk = Math.min(100, Math.round(target.riskScore * 0.65 + drivers.reduce((sum, item) => sum + item.contribution, 0) * 0.08));
    return { node: target, directRisk: target.riskScore, propagatedRisk, drivers };
  });

  if (nodeId) return results[0] || null;
  return results.sort((a, b) => b.propagatedRisk - a.propagatedRisk);
}

export function searchGraph(query: string, type?: GraphNodeType) {
  const lower = query.toLowerCase();
  const graph = buildKnowledgeGraph();
  return {
    ...graph,
    nodes: graph.nodes.filter(item => (!type || item.type === type) && (!query || item.label.toLowerCase().includes(lower) || item.summary.toLowerCase().includes(lower)))
  };
}

export function graphContextForQuestion(question: string) {
  const terms = question.toLowerCase().split(/\s+/).filter(term => term.length > 3);
  const graph = buildKnowledgeGraph();
  const matches = graph.nodes
    .filter(node => terms.some(term => node.label.toLowerCase().includes(term) || node.summary.toLowerCase().includes(term)))
    .slice(0, 6);
  return matches.map(match => {
    const relations = graph.edges
      .filter(edge => edge.source === match.id || edge.target === match.id)
      .slice(0, 4)
      .map(edge => `${edge.source === match.id ? edge.type : reverseEdgeLabel(edge.type)} ${edge.source === match.id ? edge.target : edge.source}`);
    return `${match.label} (${match.type}, risk ${match.riskScore}): ${relations.join(", ")}`;
  }).join("\n");
}

function reverseEdgeLabel(type: GraphEdgeType) {
  if (type === "supplies") return "supplied_by";
  if (type === "imports") return "imported_by";
  if (type === "exports") return "exported_by";
  if (type === "travels_to") return "receives_travel_from";
  if (type === "stored_at") return "stores";
  if (type === "owned_by") return "owns";
  return type;
}
