import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Globe, AlertTriangle, Anchor, Battery, Sparkles, FileText, Settings, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  path: string;
  id: string;
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const items: SidebarItem[] = [
    { 
      id: 'cc',
      icon: <Home className="h-4.5 w-4.5" />, 
      title: 'COMMAND CENTER', 
      subtitle: 'Energy Security Matrix',
      path: '/' 
    },
    { 
      id: 'dt',
      icon: <Globe className="h-4.5 w-4.5" />, 
      title: 'DIGITAL TWIN MAP', 
      subtitle: 'Global Logistics twin',
      path: '/digital-twin' 
    },
    { 
      id: 'sl',
      icon: <AlertTriangle className="h-4.5 w-4.5" />, 
      title: 'SCENARIO LAB', 
      subtitle: 'Predictive blockade sim',
      path: '/scenario' 
    },
    { 
      id: 'pr',
      icon: <Anchor className="h-4.5 w-4.5" />, 
      title: 'PROCUREMENT', 
      subtitle: 'Adaptive sourcing stream',
      path: '/procurement' 
    },
    { 
      id: 'spr',
      icon: <Battery className="h-4.5 w-4.5" />, 
      title: 'SPR MANAGER', 
      subtitle: 'Reserve level coverage',
      path: '/spr' 
    },
    { 
      id: 'copilot',
      icon: <Sparkles className="h-4.5 w-4.5" />, 
      title: 'AI COPILOT', 
      subtitle: 'Executive AI companion',
      path: '/ai-copilot' 
    },
    { 
      id: 'rep',
      icon: <FileText className="h-4.5 w-4.5" />, 
      title: 'REPORTS', 
      subtitle: 'Dossier intelligence archives',
      path: '/reports' 
    },
    { 
      id: 'set',
      icon: <Settings className="h-4.5 w-4.5" />, 
      title: 'SETTINGS', 
      subtitle: 'Core node configurations',
      path: '/settings' 
    }
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 70 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-[calc(100vh-76px)] bg-[#0F131C] border-r border-[#1A2130] flex flex-col justify-between select-none relative z-20 shrink-0"
      id="collapsible-sidebar"
    >
      {/* Menu list */}
      <div className="flex-1 py-4 space-y-1.5 overflow-y-auto no-scrollbar px-3">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3.5 py-3.5 px-3.5 rounded-lg transition-all text-left relative group cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-brand-gold/15 to-transparent border-l-2 border-brand-gold text-white font-bold' 
                  : 'text-gray-400 hover:text-white hover:bg-slate-800/20'
              }`}
              id={`sidebar-item-${item.id}`}
            >
              {/* Golden active glow dot */}
              {isActive && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-brand-gold rounded-full glow-gold" />
              )}

              {/* Icon */}
              <div className={`shrink-0 transition-colors ${isActive ? 'text-brand-gold' : 'group-hover:text-brand-gold'}`}>
                {item.icon}
              </div>

              {/* Title & subtitle details */}
              {!isCollapsed && (
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-sans font-bold tracking-[0.12em] uppercase">
                    {item.title}
                  </span>
                  <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wide mt-0.5 group-hover:text-gray-400">
                    {item.subtitle}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse controls at bottom */}
      <div className="p-3 border-t border-[#1A2130]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full bg-[#050B14] hover:bg-slate-800/40 border border-[#252E3E] text-gray-400 hover:text-white py-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          id="sidebar-toggle-button"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-brand-gold" />
          ) : (
            <div className="flex items-center gap-2 text-[9px] font-mono tracking-widest uppercase font-bold text-gray-500 hover:text-white">
              <ChevronLeft className="h-4 w-4 text-brand-gold" />
              <span>COLLAPSE TERMINAL</span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
