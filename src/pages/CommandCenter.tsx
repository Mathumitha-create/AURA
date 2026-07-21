import React, { useState, useEffect } from 'react';
import MapContainer from '../components/MapContainer';
import KpiCard from '../components/KpiCard';
import { 
  Battery, ShieldAlert, TrendingUp, AlertTriangle, Play, Inbox, Send, Clock
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  content: string;
  analyzed: boolean;
  analysis?: {
    location: string;
    threat: string;
    country: string;
    companies: string[];
    oilImpact: string;
    confidence: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    oneSentenceSummary: string;
    riskScoreDelta: number;
  };
}

interface DashboardKpis {
  importDependency: { value: string; subtitle: string; extraInfo: string };
  sprBuffer: { value: string; subtitle: string; extraInfo: string };
  brentCrude: {
    value: string;
    subtitle: string;
    extraInfo: string;
    trend: { value: string; isPositive: boolean };
  };
  activeThreats: { value: string; subtitle: string; extraInfo: string };
}

export default function CommandCenter() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setIsDashboardLoading(true);
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => setKpis(data.kpis))
      .catch(err => console.error("Failed to load dashboard aggregation:", err))
      .finally(() => setIsDashboardLoading(false));
  }, [refreshTrigger]);

  // Fetch news articles from backend
  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => setArticles(data))
      .catch(err => console.error("Failed to load news articles:", err));
  }, [refreshTrigger]);

  const handleIngestNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsTitle,
          content: newsContent,
          source: "Joint Intelligence Center"
        })
      });
      if (response.ok) {
        setNewsTitle('');
        setNewsContent('');
        setRefreshTrigger(prev => prev + 1);
        
        // Trigger a custom event to notify the MapContainer that risk scores changed
        setTimeout(() => {
          window.location.reload(); // Quick refresh to redraw risk highlights on map
        }, 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'critical') return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (p === 'high') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  return (
    <div className="space-y-6 animate-fade-in text-left" id="command-center-root">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" id="cc-kpis">
        <KpiCard
          title="IMPORT DEPENDENCY"
          value={isDashboardLoading ? "..." : kpis?.importDependency.value || "--"}
          subtitle={kpis?.importDependency.subtitle || "OF TOTAL CRUDE DEMAND"}
          extraInfo={kpis?.importDependency.extraInfo || "Loading data"}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <KpiCard
          title="SPR BUFFER"
          value={isDashboardLoading ? "..." : kpis?.sprBuffer.value || "--"}
          subtitle={kpis?.sprBuffer.subtitle || "NET IMPORT COVER"}
          extraInfo={kpis?.sprBuffer.extraInfo || "Loading data"}
          icon={<Battery className="h-3.5 w-3.5 text-emerald-400" />}
        />
        <KpiCard
          title="BRENT CRUDE PRICE"
          value={isDashboardLoading ? "..." : kpis?.brentCrude.value || "--"}
          subtitle={kpis?.brentCrude.subtitle || "VOLATILITY DEVIATION"}
          extraInfo={kpis?.brentCrude.extraInfo || "Loading data"}
          trend={kpis?.brentCrude.trend || { value: "--", isPositive: true }}
          icon={<TrendingUp className="h-3.5 w-3.5 text-red-500" />}
        />
        <KpiCard
          title="ACTIVE SECTOR THREATS"
          value={isDashboardLoading ? "..." : kpis?.activeThreats.value || "--"}
          subtitle={kpis?.activeThreats.subtitle || "GEOPOLITICAL MARITIME RISKS"}
          extraInfo={kpis?.activeThreats.extraInfo || "Loading data"}
          icon={<ShieldAlert className="h-3.5 w-3.5 text-red-500 animate-pulse" />}
        />
      </div>

      {/* Main Grid: Interactive Map (occupies 70%) & Live Intelligence (occupies 30%) */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6" id="cc-map-intel-grid">
        {/* Interactive World Map */}
        <div className="xl:col-span-7 flex flex-col" id="cc-map-section">
          <MapContainer />
        </div>

        {/* Live Intelligence Feed Sidebar */}
        <div className="xl:col-span-3 flex flex-col h-[620px] bg-[#0F131C]/90 border border-[#1A2130] rounded-xl overflow-hidden shadow-2xl backdrop-blur-md" id="cc-intel-section">
          {/* Header */}
          <div className="p-4 border-b border-[#1A2130] flex items-center justify-between bg-[#080B11]/50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-brand-gold animate-pulse" />
              <span className="font-mono text-xs font-bold tracking-widest text-white uppercase">LIVE INTELLIGENCE STREAM</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
          </div>

          {/* Feed List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {articles.map((art) => (
              <div 
                key={art.id} 
                className="p-3 bg-[#080B11]/80 border border-[#1E293B] hover:border-brand-gold/30 rounded-lg space-y-2.5 transition-colors text-left"
              >
                {/* Meta details */}
                <div className="flex items-center justify-between font-mono text-[9px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-bold uppercase">{art.source}</span>
                    <span>â€¢</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(art.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {art.analysis && (
                    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase ${getPriorityColor(art.analysis.priority)}`}>
                      {art.analysis.priority}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-xs font-sans font-bold text-gray-200">{art.title}</h4>

                {/* Gemini structured summary */}
                {art.analysis && (
                  <div className="p-2 bg-[#0C1220]/60 border border-brand-gold/15 rounded text-[10px] space-y-1.5">
                    <p className="text-gray-300 font-sans leading-relaxed">
                      <span className="text-brand-gold font-bold font-mono mr-1">&gt;&gt;</span>
                      {art.analysis.oneSentenceSummary}
                    </p>
                    <div className="flex justify-between font-mono text-[8px] text-gray-500 border-t border-[#1E293B] pt-1">
                      <span>LOCATION: <strong className="text-gray-400">{art.analysis.location}</strong></span>
                      <span>IMPACT: <strong className="text-gray-400">+{art.analysis.riskScoreDelta} Risk</strong></span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* News Ingestion Form */}
          <div className="p-3 border-t border-[#1A2130] bg-[#080B11]/50">
            <form onSubmit={handleIngestNews} className="space-y-2 text-left">
              <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
                INGEST LIVE INTEL REPORT (Gemini Parsing)
              </span>
              <input
                type="text"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                placeholder="Disruption Headline..."
                className="w-full bg-[#050B14] border border-[#252E3E] rounded p-2 text-[10px] font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold/50"
                required
              />
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="Copy intelligence cable text here..."
                rows={2}
                className="w-full bg-[#050B14] border border-[#252E3E] rounded p-2 text-[10px] font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold/50 no-scrollbar"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-gold hover:bg-[#FFF] text-black font-mono font-bold text-[9px] py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                <span>{isSubmitting ? "PROCESSING CABLE..." : "DISPATCH TO NEURAL GRID"}</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

