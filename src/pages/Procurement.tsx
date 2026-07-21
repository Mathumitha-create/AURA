import React, { useState, useEffect } from 'react';
import { 
  Anchor, ShieldAlert, Cpu, ArrowRight, ShieldCheck, CheckCircle, 
  TrendingUp, TrendingDown, DollarSign, Calendar, ChevronRight
} from 'lucide-react';

interface Supplier {
  country: string;
  type: string;
  basePrice: number;
  transitDays: number;
  risk: number;
  congestion: number;
  score: number;
}

interface PurchaseOrder {
  purchaseOrderId: string;
  supplier: string;
  crudeType: string;
  volumeBarrels: number;
  basePricePerBarrel: number;
  estimatedShippingCost: number;
  etaDays: number;
  savingsVsBrent: number;
  summary: string;
}

export default function Procurement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPO, setShowPO] = useState(false);

  // Fetch rankings on mount
  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = () => {
    setIsLoading(true);
    fetch('/api/procurement/rank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disruptionType: 'hormuz', severityPercent: 85 })
    })
      .then(r => r.json())
      .then(data => {
        setSuppliers(data.ranked);
        setPo(data.po);
      })
      .catch(err => console.error("Failed to fetch procurement rankings:", err))
      .finally(() => setIsLoading(false));
  };

  const handleGenerateStrategy = () => {
    setShowPO(true);
  };

  const getScoreColor = (score: number) => {
    if (score > 85) return 'text-emerald-400 font-bold';
    if (score > 60) return 'text-amber-400 font-bold';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 animate-fade-in" id="page-procurement">
      {/* Page Header */}
      <div className="border-b border-border-grid pb-4 text-left">
        <h2 className="text-2xl font-sans font-bold tracking-wider text-white">Procurement Orchestrator</h2>
        <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">
          Multi-Criteria Sourcing Optimization & Automated Purchase Planning
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Suppliers Ranking Table Card */}
        <div className="xl:col-span-2 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A2130] pb-3">
              <div className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-brand-gold animate-pulse" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">GLOBAL SUPPLIER MATRIX</span>
              </div>
              <button 
                onClick={fetchRankings}
                className="text-[9px] font-mono text-brand-gold hover:underline border border-brand-gold/20 px-2 py-0.5 rounded cursor-pointer"
              >
                REFRESH METRICS
              </button>
            </div>

            <p className="text-[10px] text-gray-400 leading-normal text-left font-sans">
              Alternative suppliers are ranked using a multi-criteria model weighing spot pricing, shipping transit delays, maritime risk registers (chokepoints), and port load limits.
            </p>

            {isLoading ? (
              <div className="py-20 flex justify-center items-center text-xs font-mono text-gray-500 animate-pulse">
                <Cpu className="h-5 w-5 animate-spin mr-2 text-brand-gold" />
                RECALCULATING SUPPLIER SCORES...
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left font-mono text-[10px] text-gray-300">
                  <thead>
                    <tr className="border-b border-[#1A2130] text-gray-500 text-[9px] uppercase tracking-wider">
                      <th className="pb-2">Supplier Country</th>
                      <th className="pb-2">Crude Gravity</th>
                      <th className="pb-2 text-right">Base Spot</th>
                      <th className="pb-2 text-right">Transit</th>
                      <th className="pb-2 text-right">Risk (Geo)</th>
                      <th className="pb-2 text-right">Congestion</th>
                      <th className="pb-2 text-right">AI Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((sup, idx) => (
                      <tr 
                        key={sup.country} 
                        className={`border-b border-[#1A2130]/50 py-3 ${
                          idx === 0 ? 'bg-brand-gold/[0.02] font-semibold text-white' : ''
                        }`}
                      >
                        <td className="py-3 flex items-center gap-2">
                          <span className="text-gray-500">#{idx+1}</span>
                          <span>{sup.country}</span>
                          {idx === 0 && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded text-[7px] font-bold uppercase animate-pulse">
                              TOP CHOICE
                            </span>
                          )}
                        </td>
                        <td>{sup.type.split(' ')[0]}</td>
                        <td className="text-right">${sup.basePrice.toFixed(2)}/bbl</td>
                        <td className="text-right text-gray-400">{sup.transitDays}d</td>
                        <td className="text-right text-gray-400">{sup.risk}/100</td>
                        <td className="text-right text-gray-400">{sup.congestion}%</td>
                        <td className={`text-right ${getScoreColor(sup.score)}`}>{sup.score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t border-[#1A2130] pt-4 mt-6 flex justify-end">
            <button
              onClick={handleGenerateStrategy}
              disabled={isLoading || !po}
              className="bg-brand-gold hover:bg-white text-black font-sans font-bold tracking-wider text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-brand-gold/25 cursor-pointer uppercase"
            >
              <span>Generate Sourcing Strategy</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Procurement Execution / PO Details Card */}
        <div className="xl:col-span-1 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-2xl flex flex-col font-mono text-xs text-left justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1A2130] pb-3">
              <Cpu className="h-4 w-4 text-brand-gold animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">STRATEGY EXECUTION</span>
            </div>

            {showPO && po ? (
              <div className="space-y-4 animate-fade-in">
                {/* Visual Status Indicator */}
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase">PURCHASE DIRECTIVE PREPARED</span>
                    <span className="text-[8px] text-gray-500">Ready to dispatch to refinery procurement hubs</span>
                  </div>
                </div>

                {/* PO Stats sheets */}
                <div className="space-y-2 text-[10px]">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block border-b border-[#1D2736] pb-1">
                    CONTRACT PROVISIONS
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between border-b border-[#1A2130]/35 pb-1">
                      <span className="text-gray-500">PO REFERENCE</span>
                      <span className="font-bold text-white">{po.purchaseOrderId}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1A2130]/35 pb-1">
                      <span className="text-gray-500">RECOMMENDED SUPPLIER</span>
                      <span className="font-bold text-brand-gold">{po.supplier}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1A2130]/35 pb-1">
                      <span className="text-gray-500">CARGO SPECIFICATION</span>
                      <span className="font-bold text-white">{po.crudeType}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1A2130]/35 pb-1">
                      <span className="text-gray-500">DISCHARGE VOLUME</span>
                      <span className="font-bold text-white">{po.volumeBarrels.toLocaleString()} bbl</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1A2130]/35 pb-1">
                      <span className="text-gray-500">BASE PRICE CONTRACT</span>
                      <span className="font-bold text-white">${po.basePricePerBarrel.toFixed(2)}/bbl</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1A2130]/35 pb-1">
                      <span className="text-gray-500">EST FREIGHT TRANSIT</span>
                      <span className="font-bold text-white">${po.estimatedShippingCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1A2130]/35 pb-1">
                      <span className="text-gray-500">EXPECTED TRANSIT DAYS</span>
                      <span className="font-bold text-white">{po.etaDays} Days</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1D2736] pt-1">
                      <span className="text-gray-500 font-bold">EST NET SAVINGS</span>
                      <span className="font-bold text-emerald-400 font-sans text-sm">${(po.savingsVsBrent / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>
                </div>

                {/* Sourcing Summary text */}
                <div className="p-3 bg-[#080B11] border border-[#1A2130] rounded-lg space-y-1.5">
                  <span className="text-[9px] text-gray-500 uppercase font-bold flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-brand-gold" />
                    AI Rational Recommendation
                  </span>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">{po.summary}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 py-24 space-y-2">
                <Cpu className="h-8 w-8 text-gray-600 animate-pulse" />
                <p className="text-[10px] leading-relaxed max-w-[200px]">
                  Recalculate compatibility scores and select "Generate Sourcing Strategy" to output automated purchase contracts.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[#1A2130]/60 pt-3">
            {showPO && po ? (
              <button 
                onClick={() => alert("Dispatching signed PO blocks through secure refinery API network...")}
                className="w-full bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-emerald-400 py-2 rounded font-sans font-bold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>DISPATCH CONTRACT TO IOC/BPCL</span>
              </button>
            ) : (
              <span className="text-[8px] text-gray-600 block text-center uppercase tracking-widest font-bold">PROCUREMENT ENHANCED BY AURA</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
