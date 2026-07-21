import React, { useState } from 'react';
import { 
  Anchor, Activity, ShieldAlert, Cpu, Battery, Database, Settings, 
  HelpCircle, AlertTriangle, Radio, Server, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TwinNode {
  id: string;
  category: 'port' | 'route' | 'tanker' | 'refinery' | 'spr' | 'distribution';
  name: string;
  status: 'nominal' | 'warning' | 'alert';
  x: number;
  y: number;
  details: Record<string, string | number>;
}

interface TwinConnection {
  from: string;
  to: string;
  animated: boolean;
  color: string;
}

const TWIN_NODES: TwinNode[] = [
  // Ports
  { id: 'node-tanura', category: 'port', name: 'Ras Tanura Terminal', status: 'nominal', x: 80, y: 100, details: { country: 'Saudi Arabia', capacity: '6.5 M bpd', loadingDocks: '12 Active', riskIndex: '35/100', securityLevel: 'ALPHA' } },
  { id: 'node-bonny', category: 'port', name: 'Bonny Island Port', status: 'warning', x: 80, y: 250, details: { country: 'Nigeria', capacity: '2.1 M bpd', loadingDocks: '5 Active', riskIndex: '45/100', securityLevel: 'BETA' } },
  { id: 'node-houston', category: 'port', name: 'Port of Houston', status: 'nominal', x: 80, y: 400, details: { country: 'United States', capacity: '4.8 M bpd', loadingDocks: '9 Active', riskIndex: '18/100', securityLevel: 'ALPHA' } },
  
  // Routes
  { id: 'node-hormuz-route', category: 'route', name: 'Hormuz Sea Route', status: 'alert', x: 240, y: 150, details: { status: 'Intimidation Patrols', dailyVessels: 14, currentThroughput: '14.2 M bpd', threatRating: '85/100', activeBlockadeLevel: 'Critical' } },
  { id: 'node-cape-route', category: 'route', name: 'Cape Bypass Route', status: 'nominal', x: 240, y: 350, details: { status: 'High Volume Transit', dailyVessels: 28, currentThroughput: '8.4 M bpd', threatRating: '15/100', congestionLevel: 'Elevated' } },
  
  // Tankers
  { id: 'node-tanker-vishal', category: 'tanker', name: 'MT Desh Vishal', status: 'nominal', x: 420, y: 180, details: { vesselClass: 'VLCC Supertanker', cargo: '2,000,000 bbl Arab Light', speed: '14.5 kts', heading: '085° ENE', destination: 'Jamnagar Port', eta: '6 Days' } },
  { id: 'node-tanker-kamal', category: 'tanker', name: 'MT Swarna Kamal', status: 'nominal', x: 420, y: 320, details: { vesselClass: 'Suezmax Tanker', cargo: '1,000,000 bbl Bonny Light', speed: '12.8 kts', heading: '090° E', destination: 'Mumbai Terminal', eta: '3 Days' } },
  
  // Refineries
  { id: 'node-ref-jamnagar', category: 'refinery', name: 'Jamnagar Refinery', status: 'nominal', x: 600, y: 180, details: { operator: 'Reliance Industries', utilization: '98% design capacity', dailyOutput: '1,240,000 bpd', inventoryLevel: '85%', supplyStatus: 'Stable' } },
  { id: 'node-ref-mumbai', category: 'refinery', name: 'Mumbai Refinery', status: 'warning', x: 600, y: 320, details: { operator: 'BPCL / HPCL', utilization: '88% design capacity', dailyOutput: '270,000 bpd', inventoryLevel: '78%', supplyStatus: 'Buffer Drawdown' } },
  
  // SPR
  { id: 'node-spr-padur', category: 'spr', name: 'Padur SPR Caverns', status: 'nominal', x: 760, y: 220, details: { state: 'Karnataka, India', capacity: '18 Million bbl', activeVolume: '16.5 Million bbl', fillPercent: '91.6%', drawdownShed: 'Hold (Ready)' } },
  
  // Distribution
  { id: 'node-dist-metropolis', category: 'distribution', name: 'Metropolis Grid Hub', status: 'warning', x: 920, y: 250, details: { gridSector: 'Western India Hub', baselineLoad: '88% peak', activeFrequency: '60.02 Hz', auxiliaryBatteryReserves: '1200MW capacity', activeOutput: '150MW active output' } }
];

const TWIN_CONNECTIONS: TwinConnection[] = [
  // Port to Route connections
  { from: 'node-tanura', to: 'node-hormuz-route', animated: true, color: '#EF4444' }, // Hormuz is high risk red
  { from: 'node-bonny', to: 'node-cape-route', animated: true, color: '#10B981' }, // Cape is green
  { from: 'node-houston', to: 'node-cape-route', animated: true, color: '#10B981' },
  
  // Route to Tanker connections
  { from: 'node-hormuz-route', to: 'node-tanker-vishal', animated: true, color: '#EF4444' },
  { from: 'node-cape-route', to: 'node-tanker-kamal', animated: true, color: '#10B981' },
  
  // Tanker to Refinery connections
  { from: 'node-tanker-vishal', to: 'node-ref-jamnagar', animated: true, color: '#F2C94C' },
  { from: 'node-tanker-kamal', to: 'node-ref-mumbai', animated: true, color: '#F2C94C' },
  
  // Refinery to SPR / Distribution
  { from: 'node-ref-jamnagar', to: 'node-spr-padur', animated: false, color: '#3E4E68' },
  { from: 'node-ref-mumbai', to: 'node-spr-padur', animated: false, color: '#3E4E68' },
  { from: 'node-spr-padur', to: 'node-dist-metropolis', animated: true, color: '#0A84FF' } // Blue power grid
];

export default function DigitalTwin() {
  const [selectedNode, setSelectedNode] = useState<TwinNode | null>(TWIN_NODES[0]);

  const getNodeColor = (status: string) => {
    if (status === 'alert') return 'border-red-500 text-red-500 bg-red-500/10 shadow-red-500/25';
    if (status === 'warning') return 'border-amber-500 text-amber-500 bg-amber-500/10 shadow-amber-500/25';
    return 'border-emerald-500 text-emerald-400 bg-emerald-500/10 shadow-emerald-500/25';
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'port': return <Anchor className="h-4 w-4" />;
      case 'route': return <Network className="h-4 w-4" />;
      case 'tanker': return <Radio className="h-4 w-4" />;
      case 'refinery': return <Cpu className="h-4 w-4" />;
      case 'spr': return <Database className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="page-digital-twin">
      {/* Header title */}
      <div className="border-b border-border-grid pb-4 text-left">
        <h2 className="text-2xl font-sans font-bold tracking-wider text-white">Digital Twin Map</h2>
        <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">
          Interactive Sourcing & Refining Logical Network
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Network Diagram Canvas */}
        <div className="xl:col-span-3 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-4 relative overflow-hidden h-[540px] flex items-center justify-center">
          <div className="absolute inset-0 cyber-grid-fine opacity-10 pointer-events-none" />

          {/* SVG Connector Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 500" preserveAspectRatio="none">
            {TWIN_CONNECTIONS.map((conn, idx) => {
              const fromNode = TWIN_NODES.find(n => n.id === conn.from);
              const toNode = TWIN_NODES.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              return (
                <g key={idx}>
                  {/* Base path */}
                  <path
                    d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                    stroke={conn.color}
                    strokeWidth="1.5"
                    opacity="0.25"
                  />
                  {/* Flow animation */}
                  {conn.animated && (
                    <circle r="3" fill={conn.color} opacity="0.9">
                      <animateMotion
                        dur="3.5s"
                        repeatCount="indefinite"
                        path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Render interactive nodes */}
          <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
            {TWIN_NODES.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{ left: `${node.x}%`, top: `${node.y}px` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer pointer-events-auto shadow-md ${getNodeColor(node.status)} ${
                    isSelected ? 'ring-2 ring-brand-gold ring-offset-2 ring-offset-black scale-110 border-brand-gold' : 'hover:scale-105'
                  }`}
                  id={`twin-node-${node.id}`}
                >
                  {getCategoryIcon(node.category)}
                  <span className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 border border-[#1A2130] text-[8px] font-mono font-bold text-gray-300 px-1.5 py-0.5 rounded shadow">
                    {node.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map Column helper labels */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-[8px] text-gray-600 border-t border-[#1A2130]/60 pt-2 z-20">
            <span>[COL_01] SOURCING PORTS</span>
            <span>[COL_02] CHOKEPOINT CHANNELS</span>
            <span>[COL_03] LIVE SHIPS</span>
            <span>[COL_04] REFINING HUBS</span>
            <span>[COL_05] RESERVE / DISTRIBUTION GRID</span>
          </div>
        </div>

        {/* Selected Node Telemetry Sidebar */}
        <div className="xl:col-span-1 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-4 flex flex-col h-[540px] text-left font-mono justify-between shadow-2xl backdrop-blur-md">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1A2130] pb-2">
                <Network className="h-4 w-4 text-brand-gold animate-pulse" />
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">NODE_METRICS</span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">{selectedNode.name}</h3>
                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase ${
                  selectedNode.status === 'alert' ? 'text-red-500 border-red-500/20 bg-red-500/10' :
                  selectedNode.status === 'warning' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' :
                  'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                }`}>
                  STATUS: {selectedNode.status}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block border-b border-[#1D2736] pb-1">
                  SENSOR READINGS
                </span>
                <div className="space-y-1.5 text-[9px]">
                  {Object.entries(selectedNode.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-[#1A2130]/40 pb-1">
                      <span className="text-gray-500 uppercase">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-bold text-gray-200">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-brand-gold/[0.02] border border-brand-gold/15 rounded text-[9px] space-y-1 leading-relaxed">
                <span className="text-brand-gold font-bold uppercase block">AI Optimization Directives</span>
                <p className="text-gray-400 font-sans">
                  Node telemetry verified. Output channels and SBM discharge loops synchronized with national reserve databases. No active local bottlenecks.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 space-y-2">
              <Network className="h-8 w-8 animate-pulse text-gray-600" />
              <p className="text-[10px]">Select any active node to inspect sensor telemetry</p>
            </div>
          )}

          <div className="border-t border-[#1A2130]/60 pt-3">
            <span className="text-[8px] text-gray-600 block text-center uppercase tracking-widest font-bold">AURA NETWORK TWIN v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
