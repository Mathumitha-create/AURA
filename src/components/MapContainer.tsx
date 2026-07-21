import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Minus, Globe, Crosshair, Anchor, Flame, Info, AlertTriangle, 
  Layers, CloudRain, Sun, Compass, Radio, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MapOverlay from './MapOverlay';

// Define asset structures
interface MapAsset {
  id: string;
  type: 'refinery' | 'chokepoint' | 'tanker' | 'port';
  name: string;
  coordinates: { x: number; y: number };
  status: string;
  riskScore: number;
  details: Record<string, string | number>;
  aiRecommendation: string;
}

const MAP_ASSETS: MapAsset[] = [
  {
    id: 'ref-jamnagar',
    type: 'refinery',
    name: 'Jamnagar Refinery Complex',
    coordinates: { x: 690, y: 220 },
    status: 'Operational (98% load)',
    riskScore: 25,
    details: {
      capacityBarrelsPerDay: '1,240,000 bpd',
      primarySuppliers: 'Saudi Arabia, Iraq, UAE',
      inventoryReserveLevel: '85%',
      importDependencyPercent: '88%',
      alternativeSupplier: 'Nigeria, United States',
      freightTransitDays: '18 days (from West Africa)',
      estimatedSBMDelay: 'None'
    },
    aiRecommendation: 'Maintain standard inventory. Target spot-arbitrage deals with US Gulf Coast to bypass Persian Gulf pricing premiums.'
  },
  {
    id: 'ref-vadinar',
    type: 'refinery',
    name: 'Vadinar Refinery (Nayara Energy)',
    coordinates: { x: 678, y: 215 },
    status: 'Operational',
    riskScore: 30,
    details: {
      capacityBarrelsPerDay: '400,000 bpd',
      primarySuppliers: 'Russia, Iraq',
      inventoryReserveLevel: '80%',
      importDependencyPercent: '90%',
      alternativeSupplier: 'Guyana, Brazil',
      freightTransitDays: '25 days (from Urals)',
      estimatedSBMDelay: 'None'
    },
    aiRecommendation: 'Secure Urals cargoes using non-USD transactions. Prepare alternative logistics routes via Mumbai terminal if regional swells increase.'
  },
  {
    id: 'ref-mumbai',
    type: 'refinery',
    name: 'Mumbai Refinery (BPCL/HPCL)',
    coordinates: { x: 700, y: 242 },
    status: 'Nominal',
    riskScore: 20,
    details: {
      capacityBarrelsPerDay: '270,000 bpd',
      primarySuppliers: 'Saudi Arabia, Iraq',
      inventoryReserveLevel: '78%',
      importDependencyPercent: '82%',
      alternativeSupplier: 'Kuwait, Oman',
      freightTransitDays: '4 days (Persian Gulf)',
      estimatedSBMDelay: '1-2 Days (harbor congestion)'
    },
    aiRecommendation: 'Deploy coastal tankers to reroute local crude from Bombay High oilfields to offset short-term Middle East disruptions.'
  },
  {
    id: 'choke-hormuz',
    type: 'chokepoint',
    name: 'Strait of Hormuz',
    coordinates: { x: 622, y: 255 },
    status: 'High Risk (Intimidation Patrols)',
    riskScore: 85,
    details: {
      dailyFlowVolume: '20.5 Million bpd',
      globalTrafficPercent: '20% of consumption',
      activeVesselsInTransit: 14,
      threatType: 'Naval harassment, drone surveillance, cargo boardings',
      alternativeRoutes: 'Cape of Good Hope, East-West Pipeline (Saudi)',
      transitTimeDelta: '+11 Days (via Cape bypass)'
    },
    aiRecommendation: 'CRITICAL ALERT: Geopolitical friction points suggest rerouting tankers to Cape of Good Hope immediately. Request naval escort coordinates for critical state-owned cargoes.'
  },
  {
    id: 'choke-bab',
    type: 'chokepoint',
    name: 'Bab-el-Mandeb Strait',
    coordinates: { x: 560, y: 295 },
    status: 'Elevated Risk (Drone Activity)',
    riskScore: 78,
    details: {
      dailyFlowVolume: '6.2 Million bpd',
      globalTrafficPercent: '8% of consumption',
      activeVesselsInTransit: 8,
      threatType: 'Drone and missile strikes from coastal rebel batteries',
      alternativeRoutes: 'Cape of Good Hope bypass',
      transitTimeDelta: '+9.5 Days (via Africa)'
    },
    aiRecommendation: 'ADVISORY: Instruct Suez-bound tankers to divert south of Africa unless running under joint military-taskforce naval escort convoy.'
  },
  {
    id: 'choke-suez',
    type: 'chokepoint',
    name: 'Suez Canal',
    coordinates: { x: 505, y: 172 },
    status: 'Stable (Delayed Transits)',
    riskScore: 50,
    details: {
      dailyFlowVolume: '5.5 Million bpd',
      backlogVesselsCount: 42,
      threatType: 'Logistical backlog from Red Sea diversions',
      alternativeRoutes: 'Cape of Good Hope bypass',
      transitTimeDelta: 'Vessel queue times average 36 hours'
    },
    aiRecommendation: 'Monitor Rotterdam-bound product tankers. Pre-order port berths at destination to prevent terminal demurrage fees.'
  },
  {
    id: 'choke-cape',
    type: 'chokepoint',
    name: 'Cape of Good Hope',
    coordinates: { x: 520, y: 415 },
    status: 'Operational (High Traffic)',
    riskScore: 15,
    details: {
      dailyFlowVolume: '8.4 Million bbl (diverted flow)',
      vesselCongestionIndex: '180% above baseline',
      bunkeringAvailability: 'Tight in South African ports',
      threatType: 'Severe sea swells and marine refueling bottlenecks',
      alternativeRoutes: 'Suez Canal (high risk)',
      transitTimeDelta: '+10 Days average'
    },
    aiRecommendation: 'Logistics systems must pre-book bunker fuel at Durban and Cape Town. Build a 10-day buffer supply into refining run models.'
  },
  {
    id: 'tanker-vishal',
    type: 'tanker',
    name: 'MT Desh Vishal (VLCC)',
    coordinates: { x: 445, y: 325 },
    status: 'En-route Cape bypass',
    riskScore: 15,
    details: {
      cargoType: 'Arabian Light Crude',
      volumeBarrels: '2,000,000 bbl',
      speedKnots: '14.5 kts',
      destinationPort: 'Jamnagar Port, India',
      etaDate: 'In 6 Days',
      lastPingTime: '3 min ago via satellite'
    },
    aiRecommendation: 'Vessel successfully bypassed Bab-el-Mandeb. Refueling scheduled at Durban terminal. Maintain course.'
  },
  {
    id: 'tanker-kamal',
    type: 'tanker',
    name: 'MT Swarna Kamal',
    coordinates: { x: 625, y: 345 },
    status: 'Transit (Indian Ocean)',
    riskScore: 22,
    details: {
      cargoType: 'Bonny Light (Sweet)',
      volumeBarrels: '1,000,000 bbl',
      speedKnots: '12.8 kts',
      destinationPort: 'Mumbai Port, India',
      etaDate: 'In 3 Days',
      lastPingTime: '12 min ago via VHF'
    },
    aiRecommendation: 'Tanker is running on schedule. Standard ocean conditions. Route clears south of meteorological cyclone zone.'
  }
];

export default function MapContainer() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Layer toggles
  const [showRefineries, setShowRefineries] = useState(true);
  const [showChokepoints, setShowChokepoints] = useState(true);
  const [showTankers, setShowTankers] = useState(true);
  const [showShippingLanes, setShowShippingLanes] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);

  // Selected Overlay Asset
  const [selectedAsset, setSelectedAsset] = useState<MapAsset | null>(MAP_ASSETS[3]); // Default Strait of Hormuz open
  const [isOverlayOpen, setIsOverlayOpen] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const resetMap = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleAssetClick = (asset: MapAsset) => {
    setSelectedAsset(asset);
    setIsOverlayOpen(true);
  };

  const handleActionNavigation = (page: string) => {
    // Navigate via sidebar clicks
    const el = document.getElementById(`sidebar-item-${page === '/scenario' ? 'sl' : 'pr'}`);
    if (el) el.click();
  };

  return (
    <div 
      className="relative w-full h-[620px] bg-[#050B14] border border-[#1A2130] rounded-xl overflow-hidden shadow-2xl flex flex-col select-none"
      id="global-map-wrapper"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Left Menu Overlay - Map Legend & Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="flex gap-2">
          <button className="bg-[#0F131C]/90 border border-[#252E3E] text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 tracking-wider shadow-md">
            <Globe className="h-3.5 w-3.5 text-brand-gold" />
            <span>AURA SAT-GRID: NODE_09</span>
          </button>
        </div>
      </div>

      {/* Layer Control Panel - Top Right */}
      <div className="absolute right-4 top-4 z-20 bg-[#0F131C]/90 border border-[#252E3E] rounded-lg p-2 flex items-center gap-3 font-mono text-[9px] text-gray-400 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-brand-gold mr-1" />
          <span className="font-bold uppercase tracking-wider mr-2 text-white">LENS CONTROLS</span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
          <input 
            type="checkbox" 
            checked={showRefineries} 
            onChange={(e) => setShowRefineries(e.target.checked)} 
            className="rounded border-[#252E3E] text-brand-gold h-3 w-3 accent-brand-gold cursor-pointer"
          />
          <span>REFINERIES</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
          <input 
            type="checkbox" 
            checked={showChokepoints} 
            onChange={(e) => setShowChokepoints(e.target.checked)} 
            className="rounded border-[#252E3E] text-brand-gold h-3 w-3 accent-brand-gold cursor-pointer"
          />
          <span>CHOKEPOINTS</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
          <input 
            type="checkbox" 
            checked={showTankers} 
            onChange={(e) => setShowTankers(e.target.checked)} 
            className="rounded border-[#252E3E] text-brand-gold h-3 w-3 accent-brand-gold cursor-pointer"
          />
          <span>TANKERS</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
          <input 
            type="checkbox" 
            checked={showWeather} 
            onChange={(e) => setShowWeather(e.target.checked)} 
            className="rounded border-[#252E3E] text-brand-gold h-3 w-3 accent-brand-gold cursor-pointer"
          />
          <span>WEATHER</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
          <input 
            type="checkbox" 
            checked={showSatellite} 
            onChange={(e) => setShowSatellite(e.target.checked)} 
            className="rounded border-[#252E3E] text-brand-gold h-3 w-3 accent-brand-gold cursor-pointer"
          />
          <span>SAT GRID</span>
        </label>
      </div>

      {/* Right Side Zoom & Re-Center Actions */}
      <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-2">
        <button 
          onClick={zoomIn}
          className="w-8 h-8 bg-[#0F131C]/90 hover:bg-[#1A2130] border border-[#252E3E] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer shadow-md group"
          title="Zoom In"
        >
          <Plus className="h-4 w-4 text-gray-400 group-hover:text-white" />
        </button>
        <button 
          onClick={zoomOut}
          className="w-8 h-8 bg-[#0F131C]/90 hover:bg-[#1A2130] border border-[#252E3E] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer shadow-md group"
          title="Zoom Out"
        >
          <Minus className="h-4 w-4 text-gray-400 group-hover:text-white" />
        </button>
        <button 
          onClick={resetMap}
          className="w-8 h-8 bg-[#0F131C]/90 hover:bg-[#1A2130] border border-[#252E3E] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer shadow-md group"
          title="Reset View"
        >
          <Crosshair className="h-4 w-4 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      {/* Main SVG Map Canvas */}
      <div className="flex-1 w-full relative overflow-hidden bg-[#050B14] cursor-grab active:cursor-grabbing">
        {/* Hex grid backdrop */}
        <div className="absolute inset-0 cyber-grid-fine opacity-20 pointer-events-none" />

        {/* Orbit Grid Overlay when Sat Grid layer is active */}
        {showSatellite && (
          <div className="absolute inset-0 bg-cyan-500/[0.02] border border-cyan-500/10 pointer-events-none z-10 font-mono text-[8px] text-cyan-500/40 p-4">
            <span>GRID SYSTEM: Mercator Ellipsoidal WGS84</span><br />
            <span>ALTITUDE: 842KM // SATELLITE: CARTOSAT-3B</span>
            <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-cyan-500/20" />
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-cyan-500/20" />
          </div>
        )}

        <div 
          className="w-full h-full origin-center transition-transform duration-100 flex items-center justify-center"
          style={{ 
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)` 
          }}
        >
          <svg 
            viewBox="0 0 1000 500" 
            className="w-full h-full max-w-5xl text-gray-700 pointer-events-auto"
            style={{ minWidth: '950px' }}
          >
            <defs>
              <radialGradient id="threatGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EB5757" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#EB5757" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#EB5757" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="activePortGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="cycloneGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Stylized Continents (Palantir Gotham Aesthetic) */}
            <g opacity={showSatellite ? "0.45" : "0.75"}>
              {/* North America */}
              <path d="M100 120 L160 110 L190 90 L240 100 L280 120 L300 150 L270 200 L240 220 L210 210 L180 230 L165 250 L150 250 L140 210 L110 190 L90 150 Z" fill="#0D1321" stroke="#1E293B" strokeWidth="1" />
              {/* Greenland */}
              <path d="M320 60 L380 50 L420 70 L390 110 L340 100 Z" fill="#0D1321" stroke="#1E293B" strokeWidth="1" />
              {/* South America */}
              <path d="M230 270 L280 290 L320 330 L310 380 L290 420 L270 450 L260 470 L250 440 L240 370 L220 320 Z" fill="#0D1321" stroke="#1E293B" strokeWidth="1" />
              {/* Africa */}
              <path d="M440 210 L500 190 L560 210 L580 240 L600 280 L590 320 L550 380 L520 420 L510 400 L500 350 L470 310 L440 280 L420 250 Z" fill="#0D1321" stroke="#1E293B" strokeWidth="1" />
              {/* Eurasia */}
              <path d="M440 120 L500 100 L580 90 L640 80 L720 90 L800 80 L880 90 L920 120 L910 170 L850 210 L810 240 L780 220 L740 250 L710 270 L640 240 L580 200 L520 180 L470 170 L440 150 Z" fill="#0D1321" stroke="#1E293B" strokeWidth="1" />
              {/* Australia */}
              <path d="M780 340 L840 330 L870 360 L850 400 L810 410 L770 380 Z" fill="#0D1321" stroke="#1E293B" strokeWidth="1" />
            </g>

            {/* Maritime Shipping Lanes Layer */}
            {showShippingLanes && (
              <g opacity="0.6">
                {/* Cape of Good Hope Bypass (Active - Green) */}
                <path 
                  d="M 800 270 Q 720 350 600 370 T 520 415 Q 420 350 310 290 T 160 215" 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4"
                  id="lane-cape"
                />
                <text x="440" y="380" fill="#10B981" fontSize="6" fontFamily="monospace" opacity="0.8">CAPE BYPASS (ACTIVE)</text>

                {/* Suez Canal / Bab-el-Mandeb Route (Disrupted / Red) */}
                <path 
                  d="M 622 255 Q 580 260 560 295 Q 520 230 505 172" 
                  fill="none" 
                  stroke="#EF4444" 
                  strokeWidth="1.5" 
                  strokeDasharray="3 3"
                  className="animate-pulse"
                  id="lane-suez"
                />
                <text x="510" y="240" fill="#EF4444" fontSize="6" fontFamily="monospace" opacity="0.8">SUEZ ROUTE (DISRUPTED)</text>

                {/* Indo-Pacific lanes */}
                <path 
                  d="M 790 265 L 700 220" 
                  fill="none" 
                  stroke="#0A84FF" 
                  strokeWidth="1.2" 
                  strokeDasharray="4 4"
                />
              </g>
            )}

            {/* Weather Overlay - Cyclone warning in Indian Ocean */}
            {showWeather && (
              <g transform="translate(680, 270)" className="animate-spin-slow" style={{ transformOrigin: '680px 270px' }}>
                <circle cx="680" cy="270" r="40" fill="url(#cycloneGlow)" />
                <path d="M 660 250 Q 680 240 700 260 T 660 290" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.4" />
                <path d="M 670 260 Q 690 250 710 270 T 670 300" fill="none" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="3 3" />
                <text x="655" y="272" fill="#3B82F6" fontSize="6" fontWeight="bold" fontFamily="monospace" opacity="0.8">CYCLONE WARN</text>
              </g>
            )}

            {/* Assets: Refineries */}
            {showRefineries && MAP_ASSETS.filter(a => a.type === 'refinery').map(asset => (
              <g 
                key={asset.id} 
                transform={`translate(${asset.coordinates.x}, ${asset.coordinates.y})`}
                className="cursor-pointer"
                onClick={() => handleAssetClick(asset)}
              >
                <circle cx="0" cy="0" r="12" fill="transparent" />
                {/* Outer pulsing ring */}
                <circle cx="0" cy="0" r="6" fill="none" stroke="#F2C94C" strokeWidth="1" className="opacity-70 animate-ping" />
                {/* Core square */}
                <rect x="-3" y="-3" width="6" height="6" fill="#F2C94C" rx="1" />
                <text x="8" y="2" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="monospace" className="drop-shadow-md">
                  {asset.name.split(' ')[0]}
                </text>
              </g>
            ))}

            {/* Assets: Chokepoints */}
            {showChokepoints && MAP_ASSETS.filter(a => a.type === 'chokepoint').map(asset => {
              const isHighRisk = asset.riskScore > 75;
              return (
                <g 
                  key={asset.id} 
                  transform={`translate(${asset.coordinates.x}, ${asset.coordinates.y})`}
                  className="cursor-pointer"
                  onClick={() => handleAssetClick(asset)}
                >
                  <circle cx="0" cy="0" r="20" fill="transparent" />
                  <circle 
                    cx="0" 
                    cy="0" 
                    r={isHighRisk ? 15 : 10} 
                    fill={isHighRisk ? "url(#threatGlow)" : "url(#activePortGlow)"} 
                    className="animate-pulse" 
                  />
                  <circle 
                    cx="0" 
                    cy="0" 
                    r="4" 
                    fill={isHighRisk ? "#EF4444" : "#22D3EE"} 
                  />
                  <text x="8" y="2" fill={isHighRisk ? "#EF4444" : "#22D3EE"} fontSize="7" fontWeight="bold" fontFamily="monospace" className="drop-shadow-md">
                    {asset.name}
                  </text>
                </g>
              );
            })}

            {/* Assets: Live Tankers */}
            {showTankers && MAP_ASSETS.filter(a => a.type === 'tanker').map(asset => (
              <g 
                key={asset.id} 
                transform={`translate(${asset.coordinates.x}, ${asset.coordinates.y})`}
                className="cursor-pointer"
                onClick={() => handleAssetClick(asset)}
              >
                {/* Ship outline mock */}
                <rect x="-5" y="-2.5" width="10" height="5" fill="#0A84FF" rx="2" className="animate-pulse" />
                <circle cx="0" cy="0" r="1.2" fill="#FFFFFF" />
                <text x="7" y="2" fill="#0A84FF" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                  {asset.name.split(' ')[1]}
                </text>
              </g>
            ))}

            {/* India Portal marker - Core hub */}
            <g transform="translate(710, 245)">
              <circle cx="0" cy="0" r="8" fill="none" stroke="#10B981" strokeWidth="1" className="animate-ping" />
              <circle cx="0" cy="0" r="3" fill="#10B981" />
              <MapPin className="h-4 w-4 text-[#10B981] -translate-x-2 -translate-y-4 animate-bounce" />
            </g>
          </svg>
        </div>
      </div>

      {/* Slide-over details info panel */}
      <AnimatePresence>
        {isOverlayOpen && selectedAsset && (
          <MapOverlay 
            isOpen={isOverlayOpen} 
            onClose={() => setIsOverlayOpen(false)} 
            data={selectedAsset} 
            onActionClick={handleActionNavigation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
