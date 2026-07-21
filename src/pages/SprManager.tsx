import React, { useState, useEffect } from 'react';
import { 
  Database, Battery, AlertTriangle, Play, Cpu, TrendingDown, 
  ArrowRight, ShieldCheck, RefreshCw, BarChart2
} from 'lucide-react';

interface Cavern {
  name: string;
  capacityMillionBbl: number;
  currentStockMillionBbl: number;
  fillPercent: number;
  fillStatus: string;
}

export default function SprManager() {
  const [caverns, setCaverns] = useState<Cavern[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(39.0);
  const [totalStock, setTotalStock] = useState(34.8);
  const [coverageDays, setCoverageDays] = useState(9.5);
  const [customReleasePercent, setCustomReleasePercent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSprData();
  }, []);

  const fetchSprData = () => {
    setIsLoading(true);
    fetch('/api/spr')
      .then(r => r.json())
      .then(data => {
        setCaverns(data.caverns);
        setTotalCapacity(data.totalCapacity);
        setTotalStock(data.totalStock);
        setCoverageDays(data.coverageDays);
      })
      .catch(err => console.error("Failed to load SPR data:", err))
      .finally(() => setIsLoading(false));
  };

  const simulatedCoverage = Math.max(0, Number((coverageDays - (coverageDays * (customReleasePercent / 100))).toFixed(1)));
  const releasedBarrels = Number(((totalStock * (customReleasePercent / 100))).toFixed(1));

  return (
    <div className="space-y-6 animate-fade-in" id="page-spr-manager">
      {/* Page Header */}
      <div className="border-b border-border-grid pb-4 text-left">
        <h2 className="text-2xl font-sans font-bold tracking-wider text-white">SPR Manager</h2>
        <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">
          Strategic Petroleum Reserve Monitoring, Drawdown Optimization & Replenishment Forecasting
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Caverns Visual Status Grid Card */}
        <div className="xl:col-span-2 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between border-b border-[#1A2130] pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-brand-gold" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">INDIA SPR CAVERN NETWORK</span>
            </div>
            <button 
              onClick={fetchSprData}
              className="text-[9px] font-mono text-brand-gold hover:underline border border-brand-gold/20 px-2 py-0.5 rounded cursor-pointer"
            >
              SENSOR SCAN
            </button>
          </div>

          <p className="text-[10px] text-gray-400 leading-normal text-left font-sans">
            Underground salt cavern storage systems situated in coastal regions, dynamically monitored using radar-echo sensors and digital pressure locks.
          </p>

          {isLoading ? (
            <div className="py-24 flex justify-center items-center text-xs font-mono text-gray-500 animate-pulse">
              <RefreshCw className="h-5 w-5 animate-spin mr-2 text-brand-gold" />
              RETRIEVING CAVERN CAPACITIES...
            </div>
          ) : (
            <div className="space-y-4">
              {caverns.map((cav) => (
                <div key={cav.name} className="p-3 bg-[#080B11] border border-[#1A2130] rounded-lg space-y-2 text-left font-mono">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-gray-200">{cav.name}</span>
                    <span className="text-[9px] text-gray-500">CAPACITY: {cav.capacityMillionBbl}M bbl</span>
                  </div>

                  {/* Visual fill gauge */}
                  <div className="relative w-full h-4 bg-[#1E293B] rounded overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-800 to-purple-500 rounded transition-all duration-500"
                      style={{ width: `${cav.fillPercent}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white uppercase tracking-wider text-shadow">
                      {cav.fillPercent}% FULL ({cav.currentStockMillionBbl}M barrels stock)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawdown Optimizer Sidebar Card */}
        <div className="xl:col-span-1 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-2xl flex flex-col font-mono text-xs text-left justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1A2130] pb-3">
              <Cpu className="h-4 w-4 text-brand-gold animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">AI DRAWDOWN CONTROLLER</span>
            </div>

            {/* Coverage Dial */}
            <div className="p-3 bg-[#080B11] border border-[#1A2130] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[9px] text-gray-500 uppercase font-bold block">NET IMPORT COVERAGE</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{simulatedCoverage} Days</span>
              </div>
              <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Battery className="h-5 w-5" />
              </div>
            </div>

            {/* AI Recommendation Alert */}
            <div className="p-3 bg-purple-500/[0.02] border border-purple-500/15 rounded-lg space-y-2">
              <span className="text-[9px] text-purple-400 font-bold uppercase block tracking-wider flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" />
                AURA Reserve Optimization Directive
              </span>
              <p className="text-[9px] text-gray-400 leading-normal font-sans">
                <strong>Hormuz Patrolling Alert:</strong> Recommending voluntary release of <strong>15% (5.22 Million Barrels)</strong> over a 14-day schedule to cushion Indian coastal refineries. Import cover will adjust from 9.5 to 8.1 days without risk flag triggers.
              </p>
              <div className="font-mono text-[8px] text-gray-600 border-t border-[#1C2534] pt-1">
                REPLENISHMENT WINDOW: October 2026 (target WTI pricing &lt; $74/bbl)
              </div>
            </div>

            {/* Interactive release slider */}
            <div className="space-y-2 pt-2 border-t border-[#1A2130]">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">
                SIMULATE EMERGENCY RELEASE
              </span>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>RELEASE RATE</span>
                  <span className="text-white font-bold">{customReleasePercent}% ({releasedBarrels}M bbl)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={customReleasePercent}
                  onChange={(e) => setCustomReleasePercent(Number(e.target.value))}
                  className="w-full h-1 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-brand-gold"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#1A2130]/60 pt-3 mt-4">
            {customReleasePercent > 0 ? (
              <button 
                onClick={() => alert(`Initiating drawdown loop: Preparing release of ${releasedBarrels}M bbl into coastal SBM distribution networks...`)}
                className="w-full bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 py-2 rounded font-sans font-bold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>AUTHORIZE DRAWDOWN DIALS</span>
              </button>
            ) : (
              <span className="text-[8px] text-gray-600 block text-center uppercase tracking-widest font-bold">SPR CONTROLLER POWERED BY AURA</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
