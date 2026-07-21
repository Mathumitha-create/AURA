import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BrainCircuit, Filter, GitBranch, Network, Radio, Search, ShieldAlert, X } from 'lucide-react';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  riskScore: number;
  status: 'nominal' | 'watch' | 'warning' | 'critical';
  summary: string;
  metadata: Record<string, string | number | boolean>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  riskScore: number;
  evidence: string;
}

interface KnowledgeGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedAt: string;
}

interface NodeExpansion {
  node: GraphNode;
  neighbors: GraphNode[];
  edges: GraphEdge[];
}

interface RiskResult {
  node: GraphNode;
  directRisk: number;
  propagatedRisk: number;
  drivers: Array<{ nodeId: string; label: string; edgeType: string; contribution: number; evidence: string }>;
}

const nodeTypes = [
  'All', 'Country', 'Supplier', 'Oil Field', 'Port', 'Tanker', 'Pipeline', 'Refinery',
  'Strategic Petroleum Reserve', 'Commodity', 'Organization', 'News Event'
];

const typeColors: Record<string, string> = {
  Country: '#38BDF8',
  Supplier: '#22D3EE',
  'Oil Field': '#A3E635',
  Port: '#0A84FF',
  Tanker: '#60A5FA',
  Pipeline: '#A855F7',
  Refinery: '#F2C94C',
  'Strategic Petroleum Reserve': '#C084FC',
  Commodity: '#10B981',
  Organization: '#F97316',
  'News Event': '#FB7185'
};

const columns: Record<string, number> = {
  Country: 90,
  Organization: 185,
  Supplier: 280,
  'Oil Field': 280,
  Commodity: 420,
  Port: 560,
  Tanker: 700,
  Pipeline: 560,
  Refinery: 840,
  'Strategic Petroleum Reserve': 840,
  'News Event': 980
};

function statusClass(status: string) {
  if (status === 'critical') return 'text-red-400 border-red-500/25 bg-red-500/10';
  if (status === 'warning') return 'text-amber-400 border-amber-500/25 bg-amber-500/10';
  if (status === 'watch') return 'text-blue-300 border-blue-500/25 bg-blue-500/10';
  return 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10';
}

function nodePosition(node: GraphNode, index: number, siblings: GraphNode[]) {
  const sameType = siblings.filter(item => item.type === node.type);
  const typeIndex = sameType.findIndex(item => item.id === node.id);
  const x = columns[node.type] || 520;
  const spread = 460 / Math.max(sameType.length, 1);
  const y = 55 + spread * typeIndex + (index % 2) * 10;
  return { x, y: Math.min(525, y) };
}

export default function KnowledgeGraph() {
  const [graph, setGraph] = useState<KnowledgeGraphPayload>({ nodes: [], edges: [], updatedAt: '' });
  const [selectedType, setSelectedType] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expansion, setExpansion] = useState<NodeExpansion | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [pathResult, setPathResult] = useState<{ nodes: GraphNode[]; edges: GraphEdge[]; totalRisk: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGraph = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (selectedType !== 'All') params.set('type', selectedType);
    fetch(`/api/graph${params.toString() ? `?${params.toString()}` : ''}`)
      .then(r => r.json())
      .then(data => setGraph(data))
      .catch(err => console.error('Failed to load knowledge graph:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchGraph();
  }, [selectedType]);

  const visibleGraph = useMemo(() => {
    const nodeIds = new Set(graph.nodes.map(node => node.id));
    return {
      nodes: graph.nodes,
      edges: graph.edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    };
  }, [graph]);

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    visibleGraph.nodes.forEach((node, index) => map.set(node.id, nodePosition(node, index, visibleGraph.nodes)));
    return map;
  }, [visibleGraph.nodes]);

  const highlightedEdgeIds = new Set([...(pathResult?.edges.map(edge => edge.id) || []), ...(expansion?.edges.map(edge => edge.id) || [])]);
  const highlightedNodeIds = new Set([selectedNodeId || '', ...(pathResult?.nodes.map(node => node.id) || []), ...(expansion?.neighbors.map(node => node.id) || [])]);

  const handleNodeClick = (id: string) => {
    setSelectedNodeId(id);
    fetch(`/api/graph/node/${id}`)
      .then(r => r.json())
      .then(data => setExpansion(data))
      .catch(err => console.error('Failed to expand graph node:', err));
    fetch(`/api/graph/risk?node=${id}`)
      .then(r => r.json())
      .then(data => setRisk(data))
      .catch(err => console.error('Failed to load graph risk:', err));
  };

  const traceDefaultPath = () => {
    fetch('/api/graph/path?from=country-iran&to=org-indian-fuel-supply')
      .then(r => r.json())
      .then(data => setPathResult(data))
      .catch(err => console.error('Failed to trace graph path:', err));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="page-knowledge-graph">
      <div className="border-b border-border-grid pb-4 text-left flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold tracking-wider text-white">Knowledge Graph</h2>
          <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">
            Central Intelligence Model: Entities, Supply Edges, Risk Propagation & News Causality
          </p>
        </div>
        <button
          onClick={traceDefaultPath}
          className="bg-brand-gold hover:bg-white text-black font-sans font-bold tracking-wider text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer uppercase"
        >
          <GitBranch className="h-4 w-4" />
          Trace Iran To Fuel Supply
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl shadow-2xl overflow-hidden min-h-[620px] relative">
          <div className="p-3 border-b border-[#1A2130] bg-[#080B11]/60 flex flex-wrap items-center gap-3 font-mono text-[10px]">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchGraph()}
                placeholder="Search countries, tankers, refineries, commodities, news events..."
                className="w-full bg-[#050B14] border border-[#252E3E] rounded-lg py-2 pl-9 pr-3 text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-brand-gold" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-[#050B14] border border-[#252E3E] rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-brand-gold/50"
              >
                {nodeTypes.map(type => <option key={type}>{type}</option>)}
              </select>
            </div>
            <button onClick={fetchGraph} className="border border-brand-gold/30 text-brand-gold rounded-lg px-3 py-2 hover:bg-brand-gold/10 cursor-pointer">
              REFRESH
            </button>
          </div>

          <div className="absolute top-[58px] left-0 right-0 bottom-0 cyber-grid-fine opacity-20 pointer-events-none" />
          {isLoading && <div className="absolute top-20 left-4 text-[10px] font-mono text-brand-gold animate-pulse z-10">REBUILDING GRAPH...</div>}

          <svg viewBox="0 0 1080 590" className="w-full h-[560px] relative z-0">
            <defs>
              <marker id="kg-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L7,3 z" fill="#3E4E68" />
              </marker>
              <filter id="nodeGlow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>

            {visibleGraph.edges.map(edge => {
              const source = positions.get(edge.source);
              const target = positions.get(edge.target);
              if (!source || !target) return null;
              const active = highlightedEdgeIds.has(edge.id);
              return (
                <g key={edge.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={active ? '#F2C94C' : '#334155'}
                    strokeWidth={active ? 2.2 : 1.1}
                    strokeOpacity={active ? 0.95 : 0.42}
                    markerEnd="url(#kg-arrow)"
                  />
                  <circle r={active ? 4 : 2.5} fill={active ? '#F2C94C' : '#0A84FF'} opacity={active ? 1 : 0.55}>
                    <animateMotion dur={active ? '1.6s' : '4.5s'} repeatCount="indefinite" path={`M ${source.x} ${source.y} L ${target.x} ${target.y}`} />
                  </circle>
                </g>
              );
            })}

            {visibleGraph.nodes.map(node => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              const active = highlightedNodeIds.has(node.id);
              const color = typeColors[node.type] || '#94A3B8';
              return (
                <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`} className="cursor-pointer" onClick={() => handleNodeClick(node.id)}>
                  <circle r={active ? 18 : 13} fill={color} opacity={active ? 0.2 : 0.1} filter="url(#nodeGlow)" />
                  <circle r={active ? 9 : 7} fill={color} stroke="#E5E7EB" strokeOpacity="0.55" strokeWidth="1" />
                  <circle r={Math.max(11, node.riskScore / 5)} fill="transparent" stroke={node.riskScore >= 75 ? '#EF4444' : node.riskScore >= 50 ? '#F59E0B' : '#10B981'} strokeOpacity={active ? 0.75 : 0.25} strokeWidth="1" />
                  <text x="0" y="25" textAnchor="middle" fill={active ? '#FFFFFF' : '#CBD5E1'} fontSize="8" fontFamily="monospace" fontWeight="700">
                    {node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="xl:col-span-1 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-4 shadow-2xl h-[620px] flex flex-col text-left font-mono">
          <div className="flex items-center gap-2 border-b border-[#1A2130] pb-3">
            <BrainCircuit className="h-4 w-4 text-brand-gold animate-pulse" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">GRAPH_INTELLIGENCE</span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-4 text-center">
            <div className="bg-[#080B11] border border-[#1A2130] rounded p-2">
              <span className="block text-base font-bold text-white">{graph.nodes.length}</span>
              <span className="text-[8px] text-gray-500 uppercase">Nodes</span>
            </div>
            <div className="bg-[#080B11] border border-[#1A2130] rounded p-2">
              <span className="block text-base font-bold text-white">{graph.edges.length}</span>
              <span className="text-[8px] text-gray-500 uppercase">Edges</span>
            </div>
            <div className="bg-[#080B11] border border-[#1A2130] rounded p-2">
              <span className="block text-base font-bold text-red-400">{visibleGraph.nodes.filter(n => n.status === 'critical').length}</span>
              <span className="text-[8px] text-gray-500 uppercase">Critical</span>
            </div>
          </div>

          {expansion ? (
            <div className="space-y-4 overflow-y-auto no-scrollbar pr-1">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-sans font-bold text-white">{expansion.node.label}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded border text-[8px] font-bold uppercase ${statusClass(expansion.node.status)}`}>
                      {expansion.node.type} // {expansion.node.status}
                    </span>
                  </div>
                  <button onClick={() => { setExpansion(null); setSelectedNodeId(null); setRisk(null); }} className="text-gray-500 hover:text-white cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed font-sans mt-3">{expansion.node.summary}</p>
              </div>

              {risk && (
                <div className="p-3 bg-red-500/[0.03] border border-red-500/15 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold uppercase">
                    <ShieldAlert className="h-3.5 w-3.5" /> Propagated Risk {risk.propagatedRisk}/100
                  </div>
                  {risk.drivers.slice(0, 3).map(driver => (
                    <div key={`${driver.nodeId}-${driver.edgeType}`} className="text-[9px] text-gray-400 border-t border-[#1A2130] pt-1">
                      <span className="text-gray-200 font-bold">{driver.label}</span> via {driver.edgeType} (+{driver.contribution})
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block border-b border-[#1A2130] pb-1">Expanded Relationships</span>
                {expansion.edges.map(edge => {
                  const neighborId = edge.source === expansion.node.id ? edge.target : edge.source;
                  const neighbor = expansion.neighbors.find(item => item.id === neighborId);
                  return (
                    <button key={edge.id} onClick={() => neighbor && handleNodeClick(neighbor.id)} className="w-full p-2 bg-[#080B11] border border-[#1A2130] hover:border-brand-gold/30 rounded text-left cursor-pointer">
                      <div className="flex justify-between gap-2 text-[9px]">
                        <span className="text-brand-gold font-bold uppercase">{edge.type}</span>
                        <span className="text-gray-500">Risk {edge.riskScore}</span>
                      </div>
                      <div className="text-[10px] text-gray-200 font-bold mt-1">{neighbor?.label || neighborId}</div>
                      <p className="text-[9px] text-gray-500 mt-1 font-sans leading-normal">{edge.evidence}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500 gap-3">
              <Network className="h-10 w-10 text-gray-600 animate-pulse" />
              <p className="text-[10px] max-w-[220px] leading-relaxed">Select a node to expand relationships, inspect propagated risk, and traverse connected intelligence.</p>
            </div>
          )}

          {pathResult && (
            <div className="mt-4 border-t border-[#1A2130] pt-3 text-[9px] text-gray-400">
              <div className="flex items-center gap-1.5 text-brand-gold font-bold uppercase mb-2">
                <Activity className="h-3.5 w-3.5" /> Path Risk {pathResult.totalRisk}/100
              </div>
              <div className="leading-relaxed font-sans">{pathResult.nodes.map(node => node.label).join(' -> ')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
