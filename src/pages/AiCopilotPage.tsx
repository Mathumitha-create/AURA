import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Bot, Terminal, ShieldAlert, Cpu, 
  Printer, Download, ShieldCheck, HelpCircle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CopilotTurn {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  time: string;
  data?: {
    situation: string;
    impact: string;
    recommendedActions: string[];
    financialImpact: string;
    confidence: number;
    sources: string[];
  };
}

const PRESET_PROMPTS = [
  "What happens if Hormuz closes?",
  "Analyze Bab-el-Mandeb drone threats",
  "Calculate SPR cavern release impact",
  "Brent crude spot price forecast"
];

export default function AiCopilotPage() {
  const [messages, setMessages] = useState<CopilotTurn[]>([
    {
      id: '1',
      sender: 'assistant',
      time: '09:08 AM',
      text: "Neural Link Synchronized. I am AURA Neural Node 09 Executive AI. I continuously scan trade logs, vessel movements, and regional weather. Ask me to cross-reference chokepoint alerts, supplier pricing, or reserve drawdowns."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputValue;
    if (!query.trim()) return;

    const userTurn: CopilotTurn = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userTurn]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data
        }]);
      } else {
        throw new Error("API error");
      }
    } catch (e) {
      console.warn(e);
      // Fallback
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: "OFFLINE FALLBACK: Secure connection to AURA Core failed. Please verify that your Gemini API Key is configured under Settings."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePrintSession = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-120px)] print:bg-white print:text-black" id="page-ai-copilot">
      {/* Page Header */}
      <div className="border-b border-border-grid pb-4 flex justify-between items-center text-left print:hidden">
        <div>
          <h2 className="text-2xl font-sans font-bold tracking-wider text-white">AI Copilot Terminal</h2>
          <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">
            RAG-based Executive Assistant Synchronized with Defense Reservoirs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrintSession}
            className="bg-[#0F131C] hover:bg-[#1A2130] border border-[#252E3E] text-gray-300 px-3.5 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            title="Print Session Briefing"
          >
            <Printer className="h-4 w-4" />
            <span>EXPORT BRIEFING (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Frame */}
      <div className="flex-1 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-md print:border-none print:bg-transparent">
        {/* Sub Header / Status Bar */}
        <div className="p-3 border-b border-[#1A2130] flex items-center justify-between bg-[#080B11]/50 print:hidden">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-brand-gold" />
            <span className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              AURA_RAG_HANDSHAKE // ENCRYPTED CORE_09
            </span>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
            Active
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#050B14]/40 print:p-0">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-4xl print:max-w-full ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'
              }`}
            >
              {/* Avatar */}
              <div className={`shrink-0 h-8 w-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold print:hidden ${
                msg.sender === 'user' 
                  ? 'bg-[#1A2130] border-[#252E3E] text-[#0A84FF]' 
                  : 'bg-brand-gold/10 border-brand-gold/20 text-brand-gold'
              }`}>
                {msg.sender === 'user' ? 'OP' : 'AI'}
              </div>

              {/* Chat Bubble */}
              <div className="space-y-1 max-w-[80%] print:max-w-full">
                {msg.text ? (
                  <div className={`p-3.5 rounded-xl text-xs font-mono leading-relaxed print:p-0 print:text-black ${
                    msg.sender === 'user'
                      ? 'bg-[#0F131C] border border-[#252E3E] text-white rounded-tr-none'
                      : 'bg-[#0F131C]/60 border border-[#1A2130] text-gray-300 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                ) : msg.data ? (
                  /* RAG Structured Presentation Card */
                  <div className="bg-[#0F131C] border border-[#1A2130] p-4 rounded-xl rounded-tl-none font-mono text-xs text-left space-y-4 text-gray-300 shadow-lg print:border-none print:p-0 print:text-black">
                    {/* Header */}
                    <div className="border-b border-[#252E3E] pb-2 flex justify-between items-center print:border-black">
                      <span className="font-bold text-brand-gold flex items-center gap-1.5 uppercase text-[10px]">
                        <Cpu className="h-4 w-4 animate-pulse" />
                        Executive Strategic Assessment
                      </span>
                      <span className="text-[9px] text-gray-500">Confidence: {msg.data.confidence}%</span>
                    </div>

                    {/* Situation */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">1. Current Situation</span>
                      <p className="text-[11px] leading-relaxed text-gray-200 font-sans print:text-black">{msg.data.situation}</p>
                    </div>

                    {/* Impact */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">2. Core Impact Matrix</span>
                      <p className="text-[11px] leading-relaxed text-gray-200 font-sans print:text-black">{msg.data.impact}</p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">3. Recommended Sourcing & Release Actions</span>
                      <ul className="space-y-1">
                        {msg.data.recommendedActions.map((act, idx) => (
                          <li key={idx} className="text-[11px] text-gray-300 leading-normal flex items-start gap-1.5 font-sans print:text-black">
                            <span className="text-brand-gold font-bold font-mono shrink-0">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Financial & Source Footer */}
                    <div className="bg-[#080B11] border border-[#1A2130] p-2.5 rounded text-[10px] space-y-1 print:border-none print:p-0 print:text-black">
                      <div className="flex justify-between">
                        <span className="text-gray-500 uppercase font-bold">Financial Surcharges</span>
                        <span className="font-bold text-emerald-400">{msg.data.financialImpact}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#1C2534] pt-1 mt-1 text-[9px]">
                        <span className="text-gray-500">Retrieved Intelligence Sources</span>
                        <span className="text-gray-400 font-semibold">{msg.data.sources.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <span className="text-[8px] font-mono text-gray-600 block px-1 print:hidden">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 mr-auto items-center text-left print:hidden">
              <div className="shrink-0 h-8 w-8 rounded-full bg-brand-gold/10 border-brand-gold/20 text-brand-gold flex items-center justify-center text-[10px] font-mono">
                AI
              </div>
              <div className="flex gap-1 py-2 px-3 bg-[#0F131C]/60 border border-[#1A2130] rounded-xl rounded-tl-none">
                <span className="h-1.5 w-1.5 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion buttons */}
        <div className="p-3 bg-[#080B11]/50 border-t border-[#1D2736] flex flex-wrap gap-2 text-left print:hidden">
          <span className="text-[9px] font-mono text-gray-500 uppercase font-bold w-full mb-1">Suggested Inquiries</span>
          {PRESET_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={(e) => handleSend(e, prompt)}
              className="bg-[#0F131C] hover:bg-[#1A2130] border border-[#252E3E] text-gray-400 hover:text-white px-2.5 py-1 rounded text-[9px] font-mono transition-all cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat input */}
        <form onSubmit={(e) => handleSend(e)} className="p-3 bg-[#0F131C] border-t border-[#1A2130] flex gap-2 print:hidden">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Query AURA regarding Strait of Hormuz, alternative supplier transit times, or cavern drawdowns..."
            className="flex-1 bg-[#050B14] border border-[#252E3E] rounded-lg px-3 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold/60"
            id="copilot-page-input"
          />
          <button
            type="submit"
            className="bg-brand-gold hover:bg-[#FFF] text-black px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
