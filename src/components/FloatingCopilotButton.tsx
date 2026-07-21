import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, Terminal, ShieldAlert, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export default function FloatingCopilotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "System handshake completed. I am AURA Executive AI. I monitor crude oil logistics, spot market pricing, and global shipping blockades. How can I assist you with energy security calibration today?",
      time: '09:08 AM'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Query the live RAG API on backend
    fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query })
    })
    .then(r => {
      if (!r.ok) throw new Error("Backend query failed");
      return r.json();
    })
    .then((data: any) => {
      const formattedResponse = `**SITUATION:** ${data.situation}
      
**IMPACT:** ${data.impact}

**RECOMMENDED ACTIONS:**
${data.recommendedActions.map((act: string) => `• ${act}`).join('\n')}

**FINANCIAL DETAIL:** ${data.financialImpact}
*(Confidence: ${data.confidence}% | Sources: ${data.sources.join(', ')})*`;

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: formattedResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    })
    .catch(err => {
      console.warn("RAG query failed, running offline fallback:", err);
      // Fallback
      let responseText = "Understood. Re-routing query through AURA's offline backup database... Connection status: nominal.";
      const lower = query.toLowerCase();

      if (lower.includes('hormuz') || lower.includes('threat') || lower.includes('close')) {
        responseText = "**SITUATION:** Strait of Hormuz threat factors indicate critical patrols.\n\n**IMPACT:** Persian Gulf imports delayed by 10-14 days due to rertouring.\n\n**RECOMMENDATIONS:**\n• Initiate SPR cavern drawdown.\n• Sourced alternative spot crude from Nigeria.";
      } else if (lower.includes('price') || lower.includes('brent')) {
        responseText = "**BRENT REPORT:** Brent Crude currently trading at $87.00/bbl (+4.2% daily gain). High risk premiums apply on all Suez Canal bound tankers.";
      } else if (lower.includes('spr') || lower.includes('reserve')) {
        responseText = "**SPR INDEX:** Current reserves cover 9.5 days of net total crude oil import requirements. Releases are subject to National Security directives.";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    });
  };

  return (
    <>
      {/* Floating Circular Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 bg-[#0F131C] border border-brand-gold/40 hover:border-brand-gold text-white font-mono text-xs font-bold px-4 py-3 rounded-full shadow-2xl transition-colors cursor-pointer glow-gold"
          id="floating-copilot-trigger"
        >
          <Sparkles className="h-4 w-4 text-brand-gold animate-pulse" />
          <span>AI COPILOT</span>
        </motion.button>
      </div>

      {/* Slide-out Sidebar Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none" id="copilot-drawer-backdrop">
            {/* Backdrop click dismisser */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-full max-w-[420px] bg-[#050B14] border-l border-[#1A2130] shadow-2xl flex flex-col pointer-events-auto"
              id="copilot-drawer-body"
            >
              {/* Header */}
              <div className="p-4 bg-[#0F131C] border-b border-[#1A2130] flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="p-1.5 rounded bg-brand-gold/10 border border-brand-gold/30">
                    <Bot className="h-4 w-4 text-brand-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-sans font-bold tracking-wider text-white">AURA Executive Copilot</h3>
                    <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
                      CORES ONLINE // SECURE
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg border border-[#252E3E] text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar bg-[#050B14]">
                {messages.map((msg, index) => (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 max-w-[85%] ${
                      msg.sender === 'user' ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'
                    }`}
                  >
                    <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center border text-[10px] font-mono ${
                      msg.sender === 'user' 
                        ? 'bg-[#1A2130] border-[#252E3E] text-[#0A84FF]' 
                        : 'bg-brand-gold/10 border-brand-gold/20 text-brand-gold'
                    }`}>
                      {msg.sender === 'user' ? 'OP' : 'AI'}
                    </div>

                    <div className="space-y-1">
                      <div className={`p-3 rounded-xl text-xs font-mono leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-[#0F131C] border border-[#252E3E] text-white rounded-tr-none' 
                          : 'bg-brand-gold/[0.03] border border-brand-gold/20 text-gray-300 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] font-mono text-gray-600 block px-1">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 mr-auto items-center text-left">
                    <div className="shrink-0 h-7 w-7 rounded-full bg-brand-gold/10 border-brand-gold/20 text-brand-gold flex items-center justify-center text-[10px]">
                      AI
                    </div>
                    <div className="flex gap-1 py-2 px-3 bg-brand-gold/[0.03] border border-brand-gold/10 rounded-xl rounded-tl-none">
                      <span className="h-1.5 w-1.5 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="p-3 bg-[#0F131C] border-t border-[#1A2130] flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask AURA about shipping risk, pricing, or SPR covers..."
                  className="flex-1 bg-[#050B14] border border-[#252E3E] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold/60"
                  id="copilot-drawer-input"
                />
                <button
                  type="submit"
                  className="bg-brand-gold hover:bg-[#FFF] text-black p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
