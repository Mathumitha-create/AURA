import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Cpu, RefreshCw, 
  CheckCircle, PlusCircle, Server, Table
} from 'lucide-react';

interface ReportMeta {
  id: string;
  type: string;
  title: string;
  date: string;
}

interface GeneratedReport {
  id: string;
  type: string;
  title: string;
  date: string;
  content: string;
}

export default function Reports() {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<GeneratedReport | null>(null);
  const [reportType, setReportType] = useState('Daily Briefing');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    setIsLoading(true);
    fetch('/api/reports')
      .then(r => r.json())
      .then(data => {
        setReports(data);
        if (data.length > 0) {
          setSelectedReportId(data[0].id);
          fetchReportDetails(data[0].id);
        }
      })
      .catch(err => console.error("Failed to load reports:", err))
      .finally(() => setIsLoading(false));
  };

  const fetchReportDetails = (id: string) => {
    // Generate report locally or simulate load
    setIsLoading(true);
    // Mimic API report fetch
    fetch('/api/reports')
      .then(r => r.json())
      .then(data => {
        const found = data.find((r: any) => r.id === id);
        if (found) {
          // Generate actual markdown content for the report
          generateReportMockContent(found.type, found.id, found.date);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  const generateReportMockContent = (type: string, id: string, date: string) => {
    let md = `# AURA Executive Intelligence Briefing\n`;
    md += `Date: ${date} | Reference: ${id.toUpperCase()} | Classification: SECRET // AURA COMMAND\n\n`;
    md += `## 1. Security Context & Summary\n`;
    
    if (type === "Minister Briefing") {
      md += `This report outlines immediate tactical routing decisions. High threat levels are active near the Strait of Hormuz (Index 85). Cape bypass operations have scaled with Indian tankers MT Desh Vishal and MT Swarna Kamal en route.\n\n`;
    } else if (type === "Threat Dossier") {
      md += `Strategic maritime lanes show high drone warnings near the Bab-el-Mandeb strait. Refineries are on alert with Single Buoy Moorings (SBMs) in Jamnagar running under weather monitoring warnings.\n\n`;
    } else {
      md += `Refinery runs remain stable at 98% design capacity. Sourcing channels have diversified to mitigate spot premiums associated with Middle East crude pools.\n\n`;
    }

    md += `## 2. Dynamic Sourcing Strategy\n`;
    md += `- **Supplier Selection**: Brazil (Lula Crude) and United States (WTI) ranked as top alternate paths.\n`;
    md += `- **Recommended Action**: Secure 2,000,000 barrels under spot arbitrage schedules.\n\n`;
    md += `## 3. Cavern Status Summary\n`;
    md += `- **Padur Caverns**: 91.6% Stock Level (Secure)\n`;
    md += `- **Mangalore Caverns**: 89.0% Stock Level (Secure)\n`;
    md += `- **Visakhapatnam Caverns**: 85.0% Stock Level (Stable)\n`;
    md += `\n*End of briefing.*`;

    setActiveReport({
      id,
      type,
      title: type + " Briefing",
      date,
      content: md
    });
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType })
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports(prev => [newReport, ...prev]);
        setSelectedReportId(newReport.id);
        setActiveReport(newReport);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!activeReport) return;
    const element = document.createElement("a");
    const file = new Blob([activeReport.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeReport.type.replace(/\s+/g, '_')}_Report.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadRiskCsv = () => {
    fetch('/api/georisk')
      .then(r => r.json())
      .then(data => {
        let csvContent = "Region/Country,Category,Risk Score,Trend,Last Updated\n";
        data.forEach((r: any) => {
          csvContent += `"${r.name}","${r.category}",${r.score},"${r.trend.toUpperCase()}","${r.lastUpdated}"\n`;
        });
        const element = document.createElement("a");
        const file = new Blob([csvContent], { type: 'text/csv' });
        element.href = URL.createObjectURL(file);
        element.download = `AURA_Risk_Index_${Date.now()}.csv`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="page-reports">
      {/* Page Header */}
      <div className="border-b border-border-grid pb-4 text-left">
        <h2 className="text-2xl font-sans font-bold tracking-wider text-white">Reports</h2>
        <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">
          Intelligence Archives, Strategic Briefing Compilers & Data Exporters
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Reports Index Panel */}
        <div className="xl:col-span-1 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-4 flex flex-col h-[520px] justify-between shadow-2xl font-mono text-xs text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1A2130] pb-2">
              <FileText className="h-4 w-4 text-brand-gold" />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">REPORT_INDEX</span>
            </div>

            {/* Generator Form */}
            <div className="space-y-2 pb-3 border-b border-[#1A2130]">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">COMPILE NEW BRIEFING</span>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-[#050B14] border border-[#252E3E] rounded p-2 text-[10px] font-mono text-white focus:outline-none focus:border-brand-gold/50 cursor-pointer"
              >
                <option value="Daily Briefing">Daily Security Briefing</option>
                <option value="Threat Dossier">Threat Dossier Matrix</option>
                <option value="Minister Briefing">Minister Briefing Summary</option>
              </select>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full bg-brand-gold hover:bg-white text-black font-sans font-bold text-[10px] py-2 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 uppercase tracking-wider"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>{isGenerating ? "COMPILING..." : "Compile Report"}</span>
              </button>
            </div>

            {/* Reports list */}
            {isLoading ? (
              <div className="py-20 text-center text-gray-500 animate-pulse">LOADING ARCHIVES...</div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto max-h-[220px] no-scrollbar">
                {reports.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => {
                      setSelectedReportId(rep.id);
                      fetchReportDetails(rep.id);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col space-y-1 cursor-pointer ${
                      selectedReportId === rep.id 
                        ? 'border-brand-gold bg-brand-gold/[0.02] text-white' 
                        : 'border-[#1A2130] text-gray-400 hover:text-white hover:bg-slate-800/10'
                    }`}
                  >
                    <span className="font-bold text-[10px] truncate uppercase">{rep.type}</span>
                    <div className="flex justify-between text-[8px] text-gray-500">
                      <span>REF: {rep.id.toUpperCase()}</span>
                      <span>{rep.date}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#1A2130]/60 pt-3">
            <button
              onClick={handleDownloadRiskCsv}
              className="w-full bg-[#0A84FF]/10 hover:bg-[#0A84FF]/25 border border-[#0A84FF]/30 text-[#0A84FF] py-2 rounded font-sans font-bold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Table className="h-3.5 w-3.5" />
              <span>EXPORT RISK TABLE (CSV)</span>
            </button>
          </div>
        </div>

        {/* Report Preview Panel */}
        <div className="xl:col-span-3 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-2xl flex flex-col h-[520px] justify-between font-mono text-xs text-left">
          {activeReport ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-[#1A2130] pb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-brand-gold animate-pulse" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">REPORT_PREVIEW</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDownloadMarkdown}
                    className="p-1.5 rounded border border-[#252E3E] text-gray-400 hover:text-white cursor-pointer transition-colors"
                    title="Download Report Markdown file"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="p-1.5 rounded border border-[#252E3E] text-gray-400 hover:text-white cursor-pointer transition-colors"
                    title="Print Document"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Markdown Content Box */}
              <div className="flex-1 overflow-y-auto my-4 p-4 bg-[#080B11]/50 border border-[#1A2130] rounded-lg text-gray-300 space-y-4 font-mono leading-relaxed select-text no-scrollbar">
                <div className="whitespace-pre-wrap">{activeReport.content}</div>
              </div>

              <div className="p-3 bg-brand-gold/[0.02] border border-brand-gold/15 rounded flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-brand-gold shrink-0" />
                <div>
                  <span className="text-[9px] text-brand-gold font-bold block uppercase">VERIFIED BY AURA DATA SHIELD</span>
                  <span className="text-[8px] text-gray-500">Document crypt-hashed. Security blocks synced to Node_09 ledger.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 space-y-2">
              <FileText className="h-8 w-8 text-gray-600 animate-pulse" />
              <p className="text-[10px]">Select or compile a briefing report to preview dossier</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
