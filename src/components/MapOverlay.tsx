import React from 'react';
import { X, ShieldAlert, Navigation, Battery, Cpu, TrendingUp, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface MapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    id: string;
    type: 'refinery' | 'chokepoint' | 'tanker' | 'port' | 'route' | 'pipeline' | 'spr' | 'weather' | 'risk-zone' | 'ai-alert';
    name: string;
    status: string;
    riskScore: number;
    details: Record<string, string | number>;
    aiRecommendation: string;
  } | null;
  onActionClick?: (page: string) => void;
}

export default function MapOverlay({ isOpen, onClose, data, onActionClick }: MapOverlayProps) {
  if (!isOpen || !data) return null;

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('critical') || s.includes('high') || s.includes('block')) return 'text-red-500 border-red-500/20 bg-red-500/10';
    if (s.includes('warning') || s.includes('elevated')) return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
    return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 h-full w-80 bg-[#0F131C]/95 border-l border-[#1A2130] shadow-2xl z-30 flex flex-col font-mono text-xs text-left"
      id="map-detail-overlay"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#1A2130] flex items-center justify-between bg-[#080B11]/50">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-brand-gold animate-pulse" />
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">ASSET_TELEMETRY</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[#1A2130] text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main stats content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Name and Status */}
        <div>
          <h3 className="text-sm font-sans font-bold text-white tracking-wide">{data.name}</h3>
          <div className="flex gap-2 items-center mt-1.5">
            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${getStatusColor(data.status)}`}>
              {data.status}
            </span>
            <span className="text-[9px] text-gray-600">ID: {data.id.toUpperCase()}</span>
          </div>
        </div>

        {/* Risk Index Dial */}
        <div className="p-3 bg-[#080B11] border border-[#1E293B] rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[9px] text-gray-500 uppercase font-bold block">RISK INDEX</span>
            <span className="text-xl font-bold tracking-wide text-white mt-0.5 block">{data.riskScore}/100</span>
          </div>
          <div className="w-10 h-10 rounded-full border border-[#1A2130] flex items-center justify-center relative">
            <svg className="w-8 h-8 -rotate-90">
              <circle cx="16" cy="16" r="14" fill="transparent" stroke="#1E293B" strokeWidth="2" />
              <circle 
                cx="16" 
                cy="16" 
                r="14" 
                fill="transparent" 
                stroke={data.riskScore > 75 ? "#EF4444" : data.riskScore > 40 ? "#F59E0B" : "#10B981"} 
                strokeWidth="2" 
                strokeDasharray="88" 
                strokeDashoffset={88 - (88 * data.riskScore) / 100} 
              />
            </svg>
            <ShieldAlert className={`absolute h-3.5 w-3.5 ${data.riskScore > 75 ? "text-red-500 animate-pulse" : "text-gray-500"}`} />
          </div>
        </div>

        {/* Spec Sheets (Key/Values) */}
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-[#1A2130] pb-1 block">
            SPECIFICATION METRICS
          </span>
          <div className="space-y-2 font-mono text-[10px]">
            {Object.entries(data.details).map(([key, val]) => (
              <div key={key} className="flex justify-between items-start border-b border-[#1A2130]/35 pb-1">
                <span className="text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-bold text-gray-200 text-right max-w-[160px] truncate" title={String(val)}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations Section */}
        <div className="p-3 bg-brand-gold/[0.02] border border-brand-gold/15 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 text-brand-gold text-[10px] font-bold">
            <Cpu className="h-3.5 w-3.5" />
            <span>AURA INTELLIGENCE ACTION</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed font-sans">{data.aiRecommendation}</p>
        </div>
      </div>

      {/* Quick Access Footer button links */}
      <div className="p-3 border-t border-[#1A2130] bg-[#080B11]/50 space-y-2">
        {(data.type === 'chokepoint' || data.type === 'risk-zone' || data.type === 'ai-alert') && onActionClick && (
          <button 
            onClick={() => onActionClick('/scenario')}
            className="w-full bg-[#10B981]/10 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-[#10B981] py-2 rounded font-sans font-bold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <TrendingUp className="h-3 w-3" />
            <span>RUN DISRUPTION SIMULATION</span>
          </button>
        )}
        {(data.type === 'refinery' || data.type === 'port' || data.type === 'route') && onActionClick && (
          <button 
            onClick={() => onActionClick('/procurement')}
            className="w-full bg-[#0A84FF]/10 hover:bg-[#0A84FF]/25 border border-[#0A84FF]/30 text-[#0A84FF] py-2 rounded font-sans font-bold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Navigation className="h-3 w-3" />
            <span>ORCHESTRATE SOURCING PLAN</span>
          </button>
        )}
        <button 
          onClick={onClose}
          className="w-full bg-[#1A2130] hover:bg-[#252E3E] text-gray-300 py-1.5 rounded font-sans uppercase text-[9px] transition-all cursor-pointer"
        >
          DISMISS TELEMETRY
        </button>
      </div>
    </motion.div>
  );
}
