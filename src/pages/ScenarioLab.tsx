import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Cpu, TrendingUp, RefreshCw, BarChart2, 
  HelpCircle, ShieldCheck, Battery, DollarSign, Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';

interface SimulationResult {
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

export default function ScenarioLab() {
  const [disruptionType, setDisruptionType] = useState('hormuz');
  const [severityPercent, setSeverityPercent] = useState(50);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runSimulation();
  }, [disruptionType, severityPercent]);

  const runSimulation = () => {
    setIsLoading(true);
    fetch('/api/scenario/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: disruptionType, percent: severityPercent })
    })
      .then(r => r.json())
      .then(data => setResult(data))
      .catch(err => console.error("Simulation run failed:", err))
      .finally(() => setIsLoading(false));
  };

  // Build chart mock data based on result values for 12 months projections
  const getProjectionsData = () => {
    if (!result) return [];
    const basePrice = 87.00;
    const priceDelta = result.brentPriceSpike;
    
    return Array.from({ length: 6 }, (_, i) => {
      const month = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'][i];
      // Price peaks at month 3 then slowly rebalances
      const multiplier = [0.2, 0.6, 1.0, 0.9, 0.7, 0.5][i];
      const simulatedPrice = basePrice + priceDelta * multiplier;
      const sprReserveRemaining = Math.max(0, 9.5 - (result.sprDrawdownRecommendationDays * multiplier * 0.8));
      
      return {
        name: month,
        "Brent Crude Price": Number(simulatedPrice.toFixed(2)),
        "SPR Buffer Cover (Days)": Number(sprReserveRemaining.toFixed(1))
      };
    });
  };

  const getRefineryLoadData = () => {
    if (!result) return [];
    return [
      { name: 'Baseline Refineries', utilization: 98, load: 100 },
      { name: 'Simulated Refineries', utilization: result.refineryUtilizationPercent, load: Math.max(10, 100 - result.oilImportDropPercent) }
    ];
  };

  return (
    <div className="space-y-6 animate-fade-in" id="page-scenario-lab">
      {/* Page Header */}
      <div className="border-b border-border-grid pb-4 text-left">
        <h2 className="text-2xl font-sans font-bold tracking-wider text-white">Scenario Lab</h2>
        <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">
          Multi-Variable Geopolitical & Meteorological Predictive Disruption Simulator
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Simulation Settings Card */}
        <div className="xl:col-span-1 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-2xl flex flex-col font-mono text-xs text-left justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1A2130] pb-3">
              <Cpu className="h-4 w-4 text-brand-gold" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">SIMULATOR CONTROLS</span>
            </div>

            {/* Select Disruption */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Disruption Vector</label>
              <select
                value={disruptionType}
                onChange={(e) => setDisruptionType(e.target.value)}
                className="w-full bg-[#050B14] border border-[#252E3E] rounded p-2 text-[10px] font-mono text-white focus:outline-none focus:border-brand-gold/50 cursor-pointer"
              >
                <option value="hormuz">Strait of Hormuz Blockade</option>
                <option value="redsea">Red Sea Rebel Attacks</option>
                <option value="opec">OPEC Voluntary Supply Cut</option>
                <option value="cyclone">Indian Ocean Severe Cyclone</option>
              </select>
            </div>

            {/* Severity slider */}
            <div className="space-y-1.5 pt-2 border-t border-[#1A2130]">
              <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Event Severity Level</label>
              <div className="space-y-1">
                <div className="flex justify-between text-white font-bold">
                  <span>DISRUPTION LEVEL</span>
                  <span className="text-brand-gold">{severityPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={severityPercent}
                  onChange={(e) => setSeverityPercent(Number(e.target.value))}
                  className="w-full h-1 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-brand-gold"
                />
              </div>
            </div>

            {/* Active alert indicator */}
            <div className="p-3 bg-red-500/[0.02] border border-red-500/10 rounded-lg space-y-1.5">
              <span className="text-[9px] text-red-500 font-bold uppercase block tracking-wider flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                Disruption Alert Warning
              </span>
              <p className="text-[9px] text-gray-400 leading-normal font-sans">
                Running real-time neural modeling calculations for regional grid failures, pipeline pressure drops, and spot market pricing.
              </p>
            </div>
          </div>

          <div className="border-t border-[#1A2130]/60 pt-3 mt-4">
            <button 
              onClick={runSimulation}
              disabled={isLoading}
              className="w-full bg-[#1A2130] hover:bg-[#252E3E] text-white py-2 rounded font-sans uppercase font-bold text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>RE-RUN PREDICTIONS</span>
            </button>
          </div>
        </div>

        {/* Prediction Results & Charts Card */}
        <div className="xl:col-span-3 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2 border-b border-[#1A2130] pb-3 text-left">
            <BarChart2 className="h-4 w-4 text-brand-gold" />
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">NEURAL MODELING OUTPUT</span>
          </div>

          {result ? (
            <div className="space-y-6">
              {/* Simulated Impact Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left font-mono text-xs">
                <div className="p-2.5 bg-[#080B11] border border-[#1A2130] rounded">
                  <span className="text-[8px] text-gray-500 uppercase block font-bold">Import Drop</span>
                  <span className="text-base font-bold text-red-500 mt-0.5 block">-{result.oilImportDropPercent}%</span>
                </div>
                <div className="p-2.5 bg-[#080B11] border border-[#1A2130] rounded">
                  <span className="text-[8px] text-gray-500 uppercase block font-bold">Brent Price Peak</span>
                  <span className="text-base font-bold text-white mt-0.5 block">+${result.brentPriceSpike}/bbl</span>
                </div>
                <div className="p-2.5 bg-[#080B11] border border-[#1A2130] rounded">
                  <span className="text-[8px] text-gray-500 uppercase block font-bold">Refinery Drop</span>
                  <span className="text-base font-bold text-amber-500 mt-0.5 block">{result.refineryUtilizationPercent}% util</span>
                </div>
                <div className="p-2.5 bg-[#080B11] border border-[#1A2130] rounded">
                  <span className="text-[8px] text-gray-500 uppercase block font-bold">Net Cost Drag</span>
                  <span className="text-base font-bold text-red-400 mt-0.5 block">+${result.importCostIncreaseBillions}B</span>
                </div>
              </div>

              {/* Dynamic Recharts Area Chart */}
              <div className="space-y-1.5 text-left">
                <span className="text-[9px] font-mono text-gray-500 uppercase font-bold block">6-Month Price & SPR Projections</span>
                <div className="w-full h-48 bg-[#080B11] border border-[#1A2130] rounded p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getProjectionsData()}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="sprGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1A2130" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={8} fontFamily="monospace" />
                      <YAxis stroke="#64748B" fontSize={8} fontFamily="monospace" />
                      <Tooltip contentStyle={{ backgroundColor: '#0F131C', borderColor: '#252E3E', fontSize: 10, fontFamily: 'monospace', color: '#FFF' }} />
                      <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Area type="monotone" dataKey="Brent Crude Price" stroke="#EF4444" fillOpacity={1} fill="url(#priceGrad)" />
                      <Area type="monotone" dataKey="SPR Buffer Cover (Days)" stroke="#10B981" fillOpacity={1} fill="url(#sprGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary text */}
              <div className="p-3.5 bg-brand-gold/[0.02] border border-brand-gold/15 rounded-lg space-y-2 text-left font-mono">
                <div className="flex items-center gap-1.5 text-brand-gold text-[10px] font-bold">
                  <Cpu className="h-4 w-4" />
                  <span>AURA STRATEGIC SIMULATION FORECAST</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed font-sans">{result.executiveSummary}</p>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-gray-500 animate-pulse font-mono">LOADING SIMULATION DATA...</div>
          )}
        </div>
      </div>
    </div>
  );
}
