import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, AlertTriangle, Battery, Clock, Sun, User, Settings, Bell, ChevronDown, Flame
} from 'lucide-react';
import AuraLogo from '../components/AuraLogo';

interface NavbarProps {
  username?: string;
  role?: string;
  onLogout?: () => void;
}

export default function Navbar({ username, role, onLogout }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock updating loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Map route to human titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'COMMAND CENTER';
      case '/digital-twin':
        return 'DIGITAL TWIN MAP';
      case '/scenario':
        return 'SCENARIO LAB';
      case '/procurement':
        return 'PROCUREMENT ENGINE';
      case '/spr':
        return 'SPR MANAGER';
      case '/reports':
        return 'ANALYTICS & REPORTS';
      case '/settings':
        return 'SYSTEM CONFIG';
      case '/ai-copilot':
        return 'AI COPILOT TERMINAL';
      default:
        return 'AURA PORTAL';
    }
  };

  const formatClock = () => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    const ampm = currentTime.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes}:${seconds} ${ampm} IST`;
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <header 
      className="h-[76px] w-full bg-[#0F131C] border-b border-[#1A2130] flex items-center justify-between px-5 sticky top-0 z-30 select-none backdrop-blur-md"
      id="top-navigation-header"
    >
      {/* Brand Logo and Title */}
      <div className="flex items-center gap-3 shrink-0" id="navbar-brand-block">
        <AuraLogo size={42} animate={false} />
        <div className="text-left leading-tight hidden md:block">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-sans font-black tracking-[0.25em] text-white">AURA</span>
            <span className="text-[7px] font-mono text-[#0A84FF] border border-[#0A84FF]/30 px-1 py-0.5 rounded font-bold">NODE_09</span>
          </div>
          <span className="text-[8px] font-mono font-bold text-gray-500 tracking-[0.2em] uppercase block">
            ENERGY RESPONSE SYSTEM
          </span>
          <span className="text-[7px] font-mono text-gray-600 block tracking-widest font-normal">
            Predict. Simulate. Protect.
          </span>
        </div>
      </div>



      {/* Right Side Telemetry stats (Clock, Users) */}
      <div className="flex items-center gap-4 text-xs font-mono ml-auto" id="navbar-right-telemetry">

        {/* Dynamic Telemetry Metric 5: REAL-TIME CLOCK */}
        <div className="hidden md:flex flex-col items-end text-right bg-[#050B14] border border-[#252E3E]/60 rounded-lg p-2 min-w-[140px]">
          <span className="text-[12px] text-white font-extrabold font-mono tracking-wider">
            {formatClock()}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-gray-500 font-bold">{formatDate()}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-[8px] text-emerald-400 font-extrabold uppercase">LIVE</span>
          </div>
        </div>

        {/* Action Triggers: Settings, Notifications & Profile */}
        <div className="flex items-center gap-1 border-l border-[#252E3E] pl-3">
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A2130] transition-colors cursor-pointer"
            title="System Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          
          <button 
            onClick={() => alert("Threat Monitor Feed: 0 new vulnerabilities detected.")}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A2130] relative transition-colors cursor-pointer"
            title="Security Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full animate-ping" />
          </button>

          {/* User profile details with disconnect */}
          <div className="relative group ml-1">
            <button 
              className="flex items-center gap-1.5 p-1 rounded-lg bg-[#050B14] hover:bg-[#1A2130] border border-[#252E3E] transition-colors cursor-pointer"
              title="Operator Identity"
            >
              <div className="h-6 w-6 rounded-md bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-bold text-xs uppercase">
                {username ? username.substring(0, 2) : 'OP'}
              </div>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>

            {/* Profile Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0F131C] border border-[#252E3E] rounded-xl shadow-2xl p-2 hidden group-hover:block z-40">
              <div className="px-3 py-2 border-b border-[#1A2130] text-left">
                <p className="text-xs font-bold text-white uppercase truncate">{username || 'Aura Operator'}</p>
                <p className="text-[9px] text-brand-gold font-bold uppercase truncate">{role || 'GRID SECURITY'}</p>
              </div>
              <button 
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-xs font-mono text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors mt-1 font-bold cursor-pointer"
              >
                DISCONNECT SESSION
              </button>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
