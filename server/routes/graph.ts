import { Router } from "express";
import { buildKnowledgeGraph, calculateGraphRisk, findGraphPath, getGraphNode, searchGraph } from "../services/graphService";
import type { GraphNodeType } from "../models/graph";

export const graphRouter = Router();

graphRouter.get("/", (req, res) => {
  const query = String(req.query.q ?? "");
  const type = req.query.type ? String(req.query.type) as GraphNodeType : undefined;
  res.json(query || type ? searchGraph(query, type) : buildKnowledgeGraph());
});

graphRouter.get("/node/:id", (req, res) => {
  const result = getGraphNode(req.params.id);
  if (!result) return res.status(404).json({ error: "Graph node not found." });
  return res.json(result);
});

graphRouter.get("/path", (req, res) => {
  const from = String(req.query.from ?? "");
  const to = String(req.query.to ?? "");
  if (!from || !to) return res.status(400).json({ error: "from and to query parameters are required." });
  const result = findGraphPath(from, to);
  if (!result) return res.status(404).json({ error: "No graph path found." });
  return res.json(result);
});

graphRouter.get("/risk", (req, res) => {
  res.json(calculateGraphRisk(req.query.node ? String(req.query.node) : undefined));
});
