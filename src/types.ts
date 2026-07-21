export type NodeType = 'generation' | 'storage' | 'distribution';
export type NodeStatus = 'operational' | 'warning' | 'alert' | 'offline';
export type Severity = 'critical' | 'warning' | 'info';

export interface PowerNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  capacity: number; // in MW
  output: number; // in MW
  load: number; // percentage
  frequency: number; // Hz, normally 60.00
  voltage: number; // kV, e.g. 500
  location: { x: number; y: number }; // percentage coords (0-100) for grid SVG map
  connections: string[]; // ids of connected nodes
}

export interface SystemAlert {
  id: string;
  nodeId: string;
  nodeName: string;
  severity: Severity;
  message: string;
  timestamp: string;
  resolved: boolean;
  acknowledged: boolean;
}

export interface TelemetrySnapshot {
  time: string;
  generation: number; // GW
  consumption: number; // GW
  frequency: number; // Hz
  batteryReserve: number; // %
}

export interface UserSession {
  username: string;
  role: string;
  clearanceLevel: string;
  isAuthenticated: boolean;
}

export type RiskLevel = 'nominal' | 'elevated' | 'critical' | 'severe';

export interface ChokePoint {
  id: string;
  name: string;
  coordinates: { x: number; y: number }; // percentage coords (0-100) for the global map
  status: RiskLevel;
  flowVolume: string; // e.g. "20.5 M bpd"
  dailyVessels: number;
  threatDescription: string;
  alternativeRoute: string;
}

export interface ShipRoute {
  id: string;
  name: string;
  path: { x: number; y: number }[]; // array of points for line drawing
  status: 'nominal' | 'active-bypass' | 'disrupted';
  color: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
