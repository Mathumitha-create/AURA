import React, { useState, useEffect } from 'react';
import AuraLogo from './AuraLogo';
import { Shield, Radio, Cpu, Database, Eye } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  { text: "Establishing secure quantum-linked satellite connection...", icon: Radio },
  { text: "Initializing cyber defense firewalls & defense protocols...", icon: Shield },
  { text: "Loading predictive neural network weather engines...", icon: Cpu },
  { text: "Fetching regional power grid SCADA telemetry...", icon: Database },
  { text: "Syncing status with auxiliary battery reservoirs...", icon: Database },
  { text: "Launching real-time interactive simulation engines...", icon: Eye },
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'initializing' | 'scanning'>('initializing');
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  // Incremental loader
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const intervalTime = stage === 'initializing' ? 45 : 30; // smooth speed
    
    timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 600); // slight pause at 100% for satisfying visual cue
          return 100;
        }

        const nextProgress = prev + 1;

        // Transition stage at 35%
        if (nextProgress === 35) {
          setStage('scanning');
        }

        // Advance boot logs periodically
        if (nextProgress % 15 === 0 && currentLogIndex < BOOT_LOGS.length - 1) {
          setCurrentLogIndex(prevIdx => Math.min(prevIdx + 1, BOOT_LOGS.length - 1));
        }

        return nextProgress;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [stage, currentLogIndex, onComplete]);

  const CurrentLogIcon = BOOT_LOGS[currentLogIndex]?.icon || Cpu;

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-[#080B11] text-white flex flex-col items-center justify-between p-6 overflow-hidden cyber-grid animate-scan"
      id="bootloader-screen"
    >
      {/* Background Tech Elements */}
      <div className="absolute inset-0 bg-[#080B11]/45 backdrop-blur-[2px] pointer-events-none" />
      
      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-brand-gold/20 pointer-events-none" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-brand-gold/20 pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-brand-gold/20 pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-brand-gold/20 pointer-events-none" />

      {/* Header telemetry info */}
      <div className="w-full max-w-6xl flex justify-between items-center text-[10px] font-mono text-gray-500 tracking-wider z-10">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-gold animate-ping" />
          <span>AURA_SECURE_BOOT_v5.4.1</span>
        </div>
        <div>UPLINK_STATUS: STANDBY // LATENCY: 12MS</div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg w-full text-center z-10 transition-all duration-700">
        
        {stage === 'initializing' ? (
          /* ================= PANEL 1: INITIALIZING STATE ================= */
          <div className="flex flex-col items-center space-y-6 animate-fade-in" id="stage-initializing">
            <AuraLogo size={140} animate={false} />
            
            <div className="space-y-2 mt-4">
              <h1 className="text-4xl font-sans font-bold tracking-[0.25em] text-white text-glow-gold">
                AURA
              </h1>
              <p className="text-xs font-sans font-semibold tracking-[0.4em] text-brand-gold">
                ENERGY RESPONSE SYSTEM
              </p>
              <p className="text-[9px] font-sans text-gray-500 tracking-[0.3em] uppercase">
                Predict. Simulate. Protect.
              </p>
            </div>
          </div>
        ) : (
          /* ================= PANEL 2: DETAILED RADAR SCANNING STATE ================= */
          <div className="flex flex-col items-center space-y-6 animate-fade-in" id="stage-scanning">
            {/* Radar Screen Outer Shield Wrapper */}
            <div className="relative p-6 rounded-full border border-brand-gold/10 bg-brand-gold/[0.01] flex items-center justify-center">
              
              {/* Outer Scanning Radar Sweep Grid (SVG overlay) */}
              <svg className="absolute inset-0 w-full h-full animate-spin-slow pointer-events-none" viewBox="0 0 200 200">
                {/* 4 compass notches */}
                <line x1="100" y1="0" x2="100" y2="8" stroke="#F2C94C" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="100" y1="192" x2="100" y2="200" stroke="#F2C94C" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="0" y1="100" x2="8" y2="100" stroke="#F2C94C" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="192" y1="100" x2="200" y2="100" stroke="#F2C94C" strokeWidth="1" strokeOpacity="0.4" />
                
                {/* Diagonal grid markings */}
                <line x1="30" y1="30" x2="40" y2="40" stroke="#F2C94C" strokeWidth="0.5" strokeOpacity="0.2" />
                <line x1="170" y1="30" x2="160" y2="40" stroke="#F2C94C" strokeWidth="0.5" strokeOpacity="0.2" />
                <line x1="30" y1="170" x2="40" y2="160" stroke="#F2C94C" strokeWidth="0.5" strokeOpacity="0.2" />
                <line x1="170" y1="170" x2="160" y2="160" stroke="#F2C94C" strokeWidth="0.5" strokeOpacity="0.2" />

                {/* Radar Sweep Arc with gradient fade */}
                <path 
                  d="M 100,100 L 100,5 A 95,95 0 0,1 182,51 Z" 
                  fill="url(#radar-sweep-grad)" 
                  opacity="0.15"
                />
                
                <defs>
                  <linearGradient id="radar-sweep-grad" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#F2C94C" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#F2C94C" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#F2C94C" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Extra Concentric Rings */}
              <div className="absolute inset-1 rounded-full border border-dashed border-brand-gold/5 animate-spin-reverse-slow" />
              <div className="absolute inset-4 rounded-full border border-brand-gold/10" />

              {/* Central Logo */}
              <AuraLogo size={140} animate={true} />
            </div>

            <div className="space-y-2 mt-4">
              <h2 className="text-3xl font-sans font-bold tracking-[0.25em] text-white">
                AURA
              </h2>
              <p className="text-xs font-sans font-semibold tracking-[0.4em] text-brand-gold">
                ENERGY RESPONSE SYSTEM
              </p>
              <p className="text-[9px] font-sans text-gray-500 tracking-[0.3em] uppercase">
                Predict. Simulate. Protect.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Progress Indicators & Boot Logs */}
      <div className="w-full max-w-lg flex flex-col items-center space-y-4 mb-4 z-10">
        
        {/* Dynamic Boot Terminal */}
        <div className="w-full h-12 bg-black/40 border border-brand-gold/10 rounded-lg p-2.5 flex items-center gap-3 font-mono text-[10px] text-gray-400">
          <CurrentLogIcon className="h-4 w-4 text-brand-gold animate-pulse shrink-0" />
          <div className="truncate text-left flex-1">
            <span className="text-brand-gold font-bold mr-1">&gt;</span>
            {BOOT_LOGS[currentLogIndex]?.text}
          </div>
          <span className="text-brand-gold shrink-0 bg-brand-gold/10 px-1.5 py-0.5 rounded text-[8px]">
            ACTIVE
          </span>
        </div>

        {/* Text Loader */}
        <div className="w-full flex justify-between items-end text-xs font-mono">
          <span className="text-[10px] text-gray-500 tracking-wider uppercase font-semibold">
            {stage === 'initializing' ? 'Initializing System...' : 'Loading Command Center'}
          </span>
          <span className="text-brand-gold font-bold text-sm tracking-wide text-glow-gold">
            {progress}%
          </span>
        </div>

        {/* Animated Custom Progress Bar */}
        <div className="w-full h-[3.5px] bg-[#1A2130]/60 rounded-full overflow-hidden relative border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-brand-gold-dark to-brand-gold rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Glowing cursor head */}
          <div 
            className="absolute top-0 bottom-0 w-2.5 bg-white glow-gold-lg blur-[1px] transition-all duration-300 ease-out"
            style={{ left: `calc(${progress}% - 5px)` }}
          />
        </div>

        {/* Skip button for quick developers/users */}
        <button 
          onClick={onComplete}
          className="text-[9px] font-mono text-gray-600 hover:text-brand-gold border border-transparent hover:border-brand-gold/20 px-2 py-0.5 rounded transition-all tracking-wider uppercase"
          id="skip-boot-button"
        >
          &gt; Bypass Loading Sequence (Fast Boot)
        </button>
      </div>
    </div>
  );
}
