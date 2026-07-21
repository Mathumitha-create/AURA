import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Crosshair, Factory, Layers, MapPin, Radio, Route, ShieldAlert } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import MapOverlay from './MapOverlay';

type LayerKey = 'tankers' | 'routes' | 'pipelines' | 'refineries' | 'spr' | 'ports' | 'chokepoints' | 'weather' | 'riskZones' | 'aiAlerts';
type FeatureType = 'tanker' | 'route' | 'pipeline' | 'refinery' | 'spr' | 'port' | 'chokepoint' | 'weather' | 'risk-zone' | 'ai-alert';

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

interface DrawerAsset {
  id: string;
  type: FeatureType;
  name: string;
  status: string;
  riskScore: number;
  details: Record<string, string | number>;
  aiRecommendation: string;
}

interface OperationalFeature {
  id: string;
  layer: LayerKey;
  type: FeatureType;
  name: string;
  status: string;
  riskScore: number;
  coordinates: [number, number];
  details: Record<string, string | number>;
  aiRecommendation: string;
}

interface LineFeature {
  id: string;
  layer: 'routes' | 'pipelines';
  type: 'route' | 'pipeline';
  name: string;
  status: string;
  riskScore: number;
  path: [number, number][];
  details: Record<string, string | number>;
  aiRecommendation: string;
}

const layerDefaults: Record<LayerKey, boolean> = {
  tankers: true,
  routes: true,
  pipelines: true,
  refineries: true,
  spr: true,
  ports: true,
  chokepoints: true,
  weather: false,
  riskZones: true,
  aiAlerts: true
};

const assetCoordinates: Record<string, [number, number]> = {
  'ref-jamnagar': [69.76, 22.46],
  'ref-vadinar': [69.72, 22.38],
  'ref-mumbai': [72.86, 18.95],
  'choke-hormuz': [56.45, 26.55],
  'choke-bab': [43.35, 12.65],
  'choke-suez': [32.35, 30.45],
  'choke-cape': [18.47, -34.36],
  'tanker-vishal': [50.4, -18.8],
  'tanker-kamal': [69.1, 10.8]
};

const staticPoints: OperationalFeature[] = [
  {
    id: 'port-jamnagar',
    layer: 'ports',
    type: 'port',
    name: 'Jamnagar Sikka Port',
    status: 'High throughput',
    riskScore: 24,
    coordinates: [69.68, 22.43],
    details: {
      connectedRefinery: 'Jamnagar Refinery Complex',
      berthCapacity: 'VLCC compatible',
      activeCargoes: 6,
      connectedRoutes: 'Hormuz, Cape Bypass',
      currentQueue: 'Nominal'
    },
    aiRecommendation: 'Keep VLCC berths reserved for Cape bypass arrivals and preserve SBM unload priority.'
  },
  {
    id: 'port-mumbai',
    layer: 'ports',
    type: 'port',
    name: 'Mumbai Port Crude Terminal',
    status: 'Nominal',
    riskScore: 28,
    coordinates: [72.84, 18.94],
    details: {
      connectedRefinery: 'Mumbai Refinery',
      berthCapacity: 'Suezmax / Aframax',
      activeCargoes: 3,
      connectedRoutes: 'Arabian Sea coastal grid',
      currentQueue: '1-2 days'
    },
    aiRecommendation: 'Use coastal tanker balancing if monsoon swell delays offshore unloading.'
  },
  {
    id: 'spr-padur',
    layer: 'spr',
    type: 'spr',
    name: 'Padur SPR Caverns',
    status: 'Secure reserve',
    riskScore: 12,
    coordinates: [74.78, 13.08],
    details: {
      capacity: '18 Million bbl',
      currentInventory: '16.5 Million bbl',
      fillPercent: '91.6%',
      connectedPorts: 'Mangalore, Jamnagar',
      drawdownStatus: 'Hold ready'
    },
    aiRecommendation: 'Maintain hold status unless Hormuz throughput drops below contingency threshold.'
  },
  {
    id: 'spr-mangalore',
    layer: 'spr',
    type: 'spr',
    name: 'Mangalore SPR Caverns',
    status: 'Secure reserve',
    riskScore: 14,
    coordinates: [74.84, 12.91],
    details: {
      capacity: '11 Million bbl',
      currentInventory: '9.8 Million bbl',
      fillPercent: '89%',
      connectedPorts: 'Mangalore crude terminal',
      drawdownStatus: 'Ready'
    },
    aiRecommendation: 'Pair release planning with west coast refinery intake schedules.'
  },
  {
    id: 'weather-arabian-sea',
    layer: 'weather',
    type: 'weather',
    name: 'Arabian Sea Weather Cell',
    status: 'Monsoon swell watch',
    riskScore: 46,
    coordinates: [66.2, 15.4],
    details: {
      wind: '26 kts',
      waveHeight: '3.1 m',
      affectedAssets: 'Jamnagar, Mumbai, Mangalore',
      forecastWindow: '48 hours'
    },
    aiRecommendation: 'Preserve berth buffers for offshore discharge delays and monitor SBM limits.'
  },
  {
    id: 'alert-hormuz',
    layer: 'aiAlerts',
    type: 'ai-alert',
    name: 'AURA Alert: Hormuz Patrol Pattern',
    status: 'Critical watch',
    riskScore: 87,
    coordinates: [56.2, 26.35],
    details: {
      detectedPattern: 'Naval harassment clustering',
      affectedRoute: 'Persian Gulf outbound crude',
      confidence: '96%',
      suggestedAction: 'Cape bypass readiness'
    },
    aiRecommendation: 'Trigger alternate sourcing plan and prepare naval escort requests for state-linked cargoes.'
  }
];

const operationalLines: LineFeature[] = [
  {
    id: 'route-hormuz-jamnagar',
    layer: 'routes',
    type: 'route',
    name: 'Persian Gulf to Jamnagar Route',
    status: 'High-risk corridor',
    riskScore: 82,
    path: [[56.45, 26.55], [60.8, 23.4], [66.6, 21.2], [69.76, 22.46]],
    details: {
      connectedPorts: 'Ras Tanura, Jamnagar',
      currentTraffic: '14 vessels',
      transitDelta: 'Baseline',
      insurancePremium: 'Elevated'
    },
    aiRecommendation: 'Reduce exposure by sequencing cargoes through alternate West Africa and Cape windows.'
  },
  {
    id: 'route-cape-bypass',
    layer: 'routes',
    type: 'route',
    name: 'Cape of Good Hope Bypass',
    status: 'Active alternate route',
    riskScore: 22,
    path: [[18.47, -34.36], [38.2, -26.1], [55.8, -17.6], [69.76, 22.46]],
    details: {
      connectedPorts: 'Bonny Island, Durban, Jamnagar',
      currentTraffic: '28 vessels',
      transitDelta: '+10 days',
      insurancePremium: 'Moderate'
    },
    aiRecommendation: 'Pre-book bunkering at Durban and smooth refinery intake around delayed arrivals.'
  },
  {
    id: 'pipeline-east-west',
    layer: 'pipelines',
    type: 'pipeline',
    name: 'Saudi East-West Pipeline',
    status: 'Operational bypass',
    riskScore: 31,
    path: [[49.66, 25.92], [45.2, 24.4], [39.2, 21.5]],
    details: {
      capacity: '5 M bpd',
      currentUtilization: 'Medium',
      bypasses: 'Hormuz maritime exposure',
      connectedPorts: 'Yanbu'
    },
    aiRecommendation: 'Use as indirect mitigation signal for Saudi export continuity under Hormuz stress.'
  }
];

const baseStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#050B14' } }
  ]
};

export default function MapContainer() {
  const mapRef = useRef<MapLibreMap | null>(null);
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const latestPointsRef = useRef<OperationalFeature[]>([]);
  const [backendAssets, setBackendAssets] = useState<MapAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<DrawerAsset | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<Record<LayerKey, boolean>>(layerDefaults);

  const points = useMemo(() => [...backendAssets.map(toFeature), ...staticPoints], [backendAssets]);

  useEffect(() => {
    latestPointsRef.current = points;
  }, [points]);

  useEffect(() => {
    fetch('/api/ships?resource=mapAssets')
      .then(r => r.json())
      .then((data: MapAsset[]) => setBackendAssets(data))
      .catch(err => console.error('Failed to load maritime map assets:', err));
  }, []);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapNodeRef.current,
      style: baseStyle,
      center: [58.5, 13.5],
      zoom: 3.25,
      pitch: 48,
      bearing: -18,
      attributionControl: false,
      dragRotate: true
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('load', () => {
      addSourcesAndLayers(map, latestPointsRef.current, layerVisibility, setSelectedAsset, setIsOverlayOpen);
      startAnimations(map, latestPointsRef, phaseRef, animationRef);
    });

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updateSources(map, points);
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    Object.entries(layerVisibility).forEach(([key, visible]) => {
      layerIdsForKey(key as LayerKey).forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      });
    });
  }, [layerVisibility]);

  const resetMap = () => {
    mapRef.current?.easeTo({ center: [58.5, 13.5], zoom: 3.25, pitch: 48, bearing: -18, duration: 900 });
  };

  const handleActionNavigation = (page: string) => {
    const el = document.getElementById(`sidebar-item-${page === '/scenario' ? 'sl' : 'pr'}`);
    if (el) el.click();
  };

  return (
    <div
      className="relative w-full h-[620px] bg-[#050B14] border border-[#1A2130] rounded-xl overflow-hidden shadow-2xl flex flex-col select-none"
      id="global-map-wrapper"
    >
      <div ref={mapNodeRef} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_45%,rgba(10,132,255,0.10),transparent_46%),linear-gradient(180deg,rgba(5,11,20,0.05),rgba(5,11,20,0.64))]" />

      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-[#0F131C]/90 border border-[#252E3E] text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 tracking-wider shadow-md backdrop-blur-md">
          <MapPin className="h-3.5 w-3.5 text-brand-gold" />
          <span>AURA GEOSPATIAL INTELLIGENCE</span>
        </div>
        <div className="bg-[#080B11]/80 border border-[#1A2130] rounded-lg px-3 py-2 text-[9px] font-mono text-gray-500 backdrop-blur-md">
          <span className="text-emerald-400">LIVE</span> MERCATOR GRID // PITCH + ROTATION ENABLED
        </div>
      </div>

      <div className="absolute right-4 top-4 z-20 w-[270px] bg-[#0F131C]/92 border border-[#252E3E] rounded-lg p-3 font-mono text-[9px] text-gray-400 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1.5 border-b border-[#1A2130] pb-2 mb-2">
          <Layers className="h-3.5 w-3.5 text-brand-gold" />
          <span className="font-bold uppercase tracking-wider text-white">Layer Control</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {(Object.keys(layerDefaults) as LayerKey[]).map(key => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={layerVisibility[key]}
                onChange={(e) => setLayerVisibility(prev => ({ ...prev, [key]: e.target.checked }))}
                className="rounded border-[#252E3E] text-brand-gold h-3 w-3 accent-brand-gold cursor-pointer"
              />
              <span>{layerLabel(key)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="absolute left-4 bottom-4 z-20 flex items-center gap-2">
        <button
          onClick={resetMap}
          className="h-8 bg-[#0F131C]/90 hover:bg-[#1A2130] border border-[#252E3E] text-white rounded-lg px-3 flex items-center gap-2 transition-colors cursor-pointer shadow-md font-mono text-[9px] font-bold"
          title="Reset View"
        >
          <Crosshair className="h-4 w-4 text-gray-400" />
          <span>RECENTER</span>
        </button>
        <div className="bg-[#0F131C]/90 border border-[#252E3E] rounded-lg px-3 py-2 font-mono text-[8px] text-gray-500 backdrop-blur-md">
          DRAG TO PAN // CTRL+DRAG ROTATES // SCROLL ZOOMS
        </div>
      </div>

      <div className="absolute bottom-4 right-16 z-20 hidden xl:flex items-center gap-2 bg-[#0F131C]/90 border border-[#252E3E] rounded-lg px-3 py-2 font-mono text-[8px] text-gray-500 backdrop-blur-md">
        <span className="flex items-center gap-1"><Radio className="h-3 w-3 text-[#0A84FF]" /> TANKERS</span>
        <span className="flex items-center gap-1"><Route className="h-3 w-3 text-emerald-400" /> ROUTES</span>
        <span className="flex items-center gap-1"><Factory className="h-3 w-3 text-brand-gold" /> REFINERIES</span>
        <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-red-500" /> RISK</span>
      </div>

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

function addSourcesAndLayers(
  map: MapLibreMap,
  points: OperationalFeature[],
  visibility: Record<LayerKey, boolean>,
  setSelectedAsset: React.Dispatch<React.SetStateAction<DrawerAsset | null>>,
  setIsOverlayOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
  map.addSource('routes', { type: 'geojson', data: lineCollection(operationalLines, 'routes') });
  map.addSource('pipelines', { type: 'geojson', data: lineCollection(operationalLines, 'pipelines') });
  map.addSource('riskZones', { type: 'geojson', data: riskZoneCollection(points) });
  (['refineries', 'chokepoints', 'tankers', 'ports', 'spr', 'weather', 'aiAlerts'] as LayerKey[]).forEach(layer => {
    map.addSource(layer, { type: 'geojson', data: pointCollection(points, layer) });
  });

  map.addLayer({
    id: 'riskZones-fill',
    type: 'circle',
    source: 'riskZones',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 28, 6, 90],
      'circle-color': ['case', ['>', ['get', 'riskScore'], 75], '#EF4444', ['>', ['get', 'riskScore'], 45], '#F59E0B', '#0A84FF'],
      'circle-opacity': 0.11,
      'circle-blur': 0.25,
      'circle-stroke-color': ['case', ['>', ['get', 'riskScore'], 75], '#EF4444', '#0A84FF'],
      'circle-stroke-opacity': 0.22,
      'circle-stroke-width': 1
    }
  });

  addLineLayer(map, 'routes-line', 'routes', '#10B981', 3, 0.76);
  addLineLayer(map, 'routes-flow', 'routes', '#F2C94C', 1.4, 0.92, [0, 4, 2]);
  addLineLayer(map, 'pipelines-line', 'pipelines', '#7C3AED', 2.4, 0.72);
  addLineLayer(map, 'pipelines-flow', 'pipelines', '#C4B5FD', 1.1, 0.88, [0, 3, 1.5]);

  addCircleLayer(map, 'ports-points', 'ports', '#22D3EE', 5);
  addCircleLayer(map, 'spr-points', 'spr', '#A855F7', 6);
  addCircleLayer(map, 'refineries-points', 'refineries', '#F2C94C', 6);
  addCircleLayer(map, 'chokepoints-points', 'chokepoints', '#EF4444', 6);
  addCircleLayer(map, 'weather-points', 'weather', '#3B82F6', 8);
  addCircleLayer(map, 'aiAlerts-points', 'aiAlerts', '#FB7185', 7);
  addCircleLayer(map, 'tankers-points', 'tankers', '#0A84FF', 5);

  const clickable = ['routes-line', 'pipelines-line', 'ports-points', 'spr-points', 'refineries-points', 'chokepoints-points', 'weather-points', 'aiAlerts-points', 'tankers-points', 'riskZones-fill'];
  clickable.forEach(id => {
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    map.on('click', id, event => {
      const feature = event.features?.[0];
      if (!feature?.properties) return;
      setSelectedAsset(drawerAssetFromProperties(feature.properties));
      setIsOverlayOpen(true);
    });
  });

  Object.entries(visibility).forEach(([key, visible]) => {
    layerIdsForKey(key as LayerKey).forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    });
  });
}

function updateSources(map: MapLibreMap, points: OperationalFeature[]) {
  (['refineries', 'chokepoints', 'tankers', 'ports', 'spr', 'weather', 'aiAlerts'] as LayerKey[]).forEach(layer => {
    const source = map.getSource(layer) as GeoJSONSource | undefined;
    source?.setData(pointCollection(points, layer));
  });
  (map.getSource('riskZones') as GeoJSONSource | undefined)?.setData(riskZoneCollection(points));
}

function startAnimations(
  map: MapLibreMap,
  latestPointsRef: React.MutableRefObject<OperationalFeature[]>,
  phaseRef: React.MutableRefObject<number>,
  animationRef: React.MutableRefObject<number | null>
) {
  const tick = () => {
    phaseRef.current += 0.0025;
    const moved = latestPointsRef.current.map(point => {
      if (point.layer !== 'tankers') return point;
      const path = point.id === 'tanker-vishal' ? operationalLines[1].path : operationalLines[0].path;
      return { ...point, coordinates: interpolatePath(path, phaseRef.current + (point.id === 'tanker-vishal' ? 0 : 0.34)) };
    });
    (map.getSource('tankers') as GeoJSONSource | undefined)?.setData(pointCollection(moved, 'tankers'));

    const dashOffset = Math.floor((phaseRef.current * 100) % 6);
    if (map.getLayer('routes-flow')) map.setPaintProperty('routes-flow', 'line-dasharray', [dashOffset, 4, 2]);
    if (map.getLayer('pipelines-flow')) map.setPaintProperty('pipelines-flow', 'line-dasharray', [dashOffset, 3, 1.5]);

    animationRef.current = requestAnimationFrame(tick);
  };

  animationRef.current = requestAnimationFrame(tick);
}

function toFeature(asset: MapAsset): OperationalFeature {
  const coordinates = assetCoordinates[asset.id] || [Number(asset.coordinates.x), Number(asset.coordinates.y)];
  const layer: LayerKey = asset.type === 'tanker' ? 'tankers' : asset.type === 'chokepoint' ? 'chokepoints' : asset.type === 'port' ? 'ports' : 'refineries';

  return {
    id: asset.id,
    layer,
    type: asset.type,
    name: asset.name,
    status: asset.status,
    riskScore: asset.riskScore,
    coordinates,
    details: asset.details,
    aiRecommendation: asset.aiRecommendation
  };
}

function pointCollection(features: OperationalFeature[], layer: LayerKey): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.filter(feature => feature.layer === layer).map(feature => ({
      type: 'Feature',
      id: feature.id,
      geometry: { type: 'Point', coordinates: feature.coordinates },
      properties: encodeProperties(feature)
    }))
  };
}

function lineCollection(features: LineFeature[], layer: 'routes' | 'pipelines'): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.filter(feature => feature.layer === layer).map(feature => ({
      type: 'Feature',
      id: feature.id,
      geometry: { type: 'LineString', coordinates: feature.path },
      properties: encodeProperties(feature)
    }))
  };
}

function riskZoneCollection(points: OperationalFeature[]): GeoJSON.FeatureCollection {
  const zones = points
    .filter(point => ['chokepoints', 'weather', 'aiAlerts'].includes(point.layer))
    .map(point => ({
      type: 'Feature' as const,
      id: `${point.id}-risk`,
      geometry: { type: 'Point' as const, coordinates: point.coordinates },
      properties: encodeProperties({ ...point, id: `${point.id}-risk`, type: 'risk-zone', layer: 'riskZones', name: `${point.name} Risk Zone` })
    }));

  return { type: 'FeatureCollection', features: zones };
}

function encodeProperties(feature: OperationalFeature | LineFeature) {
  return {
    id: feature.id,
    layer: feature.layer,
    type: feature.type,
    name: feature.name,
    status: feature.status,
    riskScore: feature.riskScore,
    details: JSON.stringify(feature.details),
    aiRecommendation: feature.aiRecommendation
  };
}

function drawerAssetFromProperties(properties: any): DrawerAsset {
  return {
    id: String(properties.id),
    type: properties.type as FeatureType,
    name: String(properties.name),
    status: String(properties.status),
    riskScore: Number(properties.riskScore || 0),
    details: typeof properties.details === 'string' ? JSON.parse(properties.details) : properties.details || {},
    aiRecommendation: String(properties.aiRecommendation || '')
  };
}

function addLineLayer(map: MapLibreMap, id: string, source: string, color: string, width: number, opacity: number, dasharray?: number[]) {
  map.addLayer({
    id,
    type: 'line',
    source,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': color,
      'line-width': width,
      'line-opacity': opacity,
      ...(dasharray ? { 'line-dasharray': dasharray } : {})
    }
  });
}

function addCircleLayer(map: MapLibreMap, id: string, source: string, color: string, radius: number) {
  map.addLayer({
    id,
    type: 'circle',
    source,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, radius, 7, radius + 4],
      'circle-color': color,
      'circle-opacity': 0.92,
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': 1,
      'circle-stroke-opacity': 0.45,
      'circle-blur': 0.04
    }
  });
}

function interpolatePath(path: [number, number][], phase: number): [number, number] {
  const normalized = phase % 1;
  const segmentCount = path.length - 1;
  const segment = Math.min(segmentCount - 1, Math.floor(normalized * segmentCount));
  const localT = normalized * segmentCount - segment;
  const start = path[segment];
  const end = path[segment + 1];
  return [start[0] + (end[0] - start[0]) * localT, start[1] + (end[1] - start[1]) * localT];
}

function layerIdsForKey(key: LayerKey) {
  const map: Record<LayerKey, string[]> = {
    tankers: ['tankers-points'],
    routes: ['routes-line', 'routes-flow'],
    pipelines: ['pipelines-line', 'pipelines-flow'],
    refineries: ['refineries-points'],
    spr: ['spr-points'],
    ports: ['ports-points'],
    chokepoints: ['chokepoints-points'],
    weather: ['weather-points'],
    riskZones: ['riskZones-fill'],
    aiAlerts: ['aiAlerts-points']
  };
  return map[key];
}

function layerLabel(key: LayerKey) {
  const labels: Record<LayerKey, string> = {
    tankers: 'Oil Tankers',
    routes: 'Shipping Routes',
    pipelines: 'Pipelines',
    refineries: 'Refineries',
    spr: 'SPR',
    ports: 'Ports',
    chokepoints: 'Chokepoints',
    weather: 'Weather',
    riskZones: 'Risk Zones',
    aiAlerts: 'AI Alerts'
  };
  return labels[key];
}
