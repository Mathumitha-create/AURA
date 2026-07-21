export type GraphNodeType =
  | "Country"
  | "Supplier"
  | "Oil Field"
  | "Port"
  | "Tanker"
  | "Pipeline"
  | "Refinery"
  | "Strategic Petroleum Reserve"
  | "Commodity"
  | "Organization"
  | "News Event";

export type GraphEdgeType =
  | "supplies"
  | "imports"
  | "exports"
  | "travels_to"
  | "connected_to"
  | "at_risk_due_to"
  | "blocked_by"
  | "stored_at"
  | "owned_by";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  riskScore: number;
  status: "nominal" | "watch" | "warning" | "critical";
  summary: string;
  metadata: Record<string, string | number | boolean>;
  updatedAt: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  weight: number;
  riskScore: number;
  evidence: string;
  updatedAt: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedAt: string;
}

export interface GraphPathResult {
  from: string;
  to: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalRisk: number;
}

export interface GraphRiskResult {
  node: GraphNode;
  directRisk: number;
  propagatedRisk: number;
  drivers: Array<{
    nodeId: string;
    label: string;
    edgeType: GraphEdgeType;
    contribution: number;
    evidence: string;
  }>;
}
