import fs from 'fs';
import path from 'path';

// Define DB Types
export interface Article {
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
    confidence: number; // 0-100
    priority: 'low' | 'medium' | 'high' | 'critical';
    oneSentenceSummary: string;
    riskScoreDelta: number; // impact on global risk score
  };
}

export interface Alert {
  id: string;
  type: 'security' | 'market' | 'infrastructure' | 'system';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  acknowledged: boolean;
  nodeId?: string;
}

export interface RiskScore {
  id: string;
  name: string;
  category: 'country' | 'chokepoint' | 'organization';
  score: number; // 0 - 100
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  details: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  role: string;
  action: string;
  ipAddress: string;
  details: string;
}

export interface SystemSettings {
  activeRole: 'NEXUS COMMANDER' | 'JOINT COMMAND SECURITY' | 'GRID DEFENSE ANALYST';
  geminiApiKey: string;
  refreshIntervalSeconds: number;
  emailAlertsEnabled: boolean;
  smsAlertsEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  bypassHandshake: boolean;
  systemTheme: 'dark' | 'light' | 'tactical';
}

export interface DbSchema {
  articles: Article[];
  alerts: Alert[];
  riskScores: RiskScore[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Default initial state / Seed Data
const DEFAULT_DB: DbSchema = {
  articles: [
    {
      id: 'art-001',
      title: 'Iranian Naval Patrols Intimidating Commercial Vessels Near Hormuz',
      source: 'Reuters',
      publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      content: 'Local maritime observers report increased maneuvers by speedboats belonging to the Iranian Revolutionary Guard near the shipping lanes of the Strait of Hormuz. Tankers have been advised to maintain standard security spacing.',
      analyzed: true,
      analysis: {
        location: 'Strait of Hormuz',
        threat: 'Harassment of commercial vessels by foreign naval speedboats',
        country: 'Iran',
        companies: ['IRGC Navy', 'National Iranian Tanker Co'],
        oilImpact: 'Elevated insurance premium risks; potential shipping delays of 24-48 hours.',
        confidence: 92,
        priority: 'high',
        oneSentenceSummary: 'Iranian naval activity increased near Strait of Hormuz, raising shipping delays and regional insurance risk.',
        riskScoreDelta: 8
      }
    },
    {
      id: 'art-002',
      title: 'Bab-el-Mandeb Chokepoint Alerts: Drone Activity Reported over Red Sea Cargo lanes',
      source: 'AP News',
      publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      content: 'Multiple cargo vessels reported sighting unmanned aerial vehicles flying at low altitudes near the southern gates of the Red Sea. No vessel damage was reported, but naval defense systems are on alert.',
      analyzed: true,
      analysis: {
        location: 'Bab-el-Mandeb Strait',
        threat: 'Drone sightings near commercial shipping lanes',
        country: 'Yemen / Regional Hotspot',
        companies: ['Red Sea Carriers Assoc'],
        oilImpact: 'Forcing tankers to consider alternative routing via Cape of Good Hope, adding 9-12 days.',
        confidence: 88,
        priority: 'critical',
        oneSentenceSummary: 'Drone activity near Bab-el-Mandeb Strait triggers military alert and routing safety concerns for Red Sea tankers.',
        riskScoreDelta: 12
      }
    },
    {
      id: 'art-003',
      title: 'OPEC+ Considers Further Voluntary Crude Production Cuts to Stabilize Pricing',
      source: 'Bloomberg',
      publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      content: 'An internal circular indicates OPEC delegates are reviewing a voluntary production cut of up to 500,000 barrels per day ahead of the upcoming ministerial session. Traders react as Brent prices push upward.',
      analyzed: true,
      analysis: {
        location: 'Vienna / Global Market',
        threat: 'Voluntary output cuts reducing global spare capacity',
        country: 'OPEC / Russia / Saudi Arabia',
        companies: ['Saudi Aramco', 'Rosneft'],
        oilImpact: 'Reduction of active supply, driving Brent Crude prices towards $87-$90/bbl.',
        confidence: 95,
        priority: 'medium',
        oneSentenceSummary: 'OPEC+ voluntarily considers 500k bpd crude cuts, tightening global supply and increasing Brent prices.',
        riskScoreDelta: 4
      }
    }
  ],
  alerts: [
    {
      id: 'alert-001',
      type: 'security',
      title: 'Strait of Hormuz Geopolitical Threat Elevated',
      message: 'Active naval intimidation patrols reported. Risk index increased to 85.',
      severity: 'critical',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      acknowledged: false,
      nodeId: 'hormuz'
    },
    {
      id: 'alert-002',
      type: 'market',
      title: 'Brent Crude Volatility Warning',
      message: 'Brent crude prices spiked +4.2% today, currently holding at $87.00/bbl.',
      severity: 'warning',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      acknowledged: true
    }
  ],
  riskScores: [
    { id: 'risk-hormuz', name: 'Strait of Hormuz', category: 'chokepoint', score: 85, trend: 'up', lastUpdated: new Date().toISOString(), details: 'Active naval patrols, high geopolitical tensions, threat of cargo inspections.' },
    { id: 'risk-bab', name: 'Bab-el-Mandeb', category: 'chokepoint', score: 78, trend: 'up', lastUpdated: new Date().toISOString(), details: 'Unmanned aerial vehicle threats and regional rebel activity.' },
    { id: 'risk-suez', name: 'Suez Canal', category: 'chokepoint', score: 50, trend: 'stable', lastUpdated: new Date().toISOString(), details: 'Congestion due to Red Sea diversions but canal itself is fully open.' },
    { id: 'risk-cape', name: 'Cape of Good Hope', category: 'chokepoint', score: 15, trend: 'down', lastUpdated: new Date().toISOString(), details: 'Safe but lengthy alternative route; increased commercial traffic.' },
    { id: 'risk-iran', name: 'Iran', category: 'country', score: 82, trend: 'up', lastUpdated: new Date().toISOString(), details: 'Aggressive naval posturing, enrichment milestones, and sanction friction.' },
    { id: 'risk-saudi', name: 'Saudi Arabia', category: 'country', score: 35, trend: 'stable', lastUpdated: new Date().toISOString(), details: 'Production adjustments inline with OPEC guidelines; infrastructure secure.' },
    { id: 'risk-russia', name: 'Russia', category: 'country', score: 72, trend: 'stable', lastUpdated: new Date().toISOString(), details: 'Sanction enforcement, shadow fleet operations, and Western export blocks.' },
    { id: 'risk-usa', name: 'United States', category: 'country', score: 20, trend: 'stable', lastUpdated: new Date().toISOString(), details: 'Record shale volumes offsetting Middle East shortfalls; ports running nominally.' },
    { id: 'risk-nigeria', name: 'Nigeria', category: 'country', score: 45, trend: 'down', lastUpdated: new Date().toISOString(), details: 'Minor delta port unrest but Bonny Light exports loading at target rates.' },
    { id: 'risk-opec', name: 'OPEC', category: 'organization', score: 55, trend: 'up', lastUpdated: new Date().toISOString(), details: 'Active quota enforcement, targeting price floor stabilization.' }
  ],
  auditLogs: [
    {
      id: 'log-001',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      username: 'admin_nexus',
      role: 'NEXUS COMMANDER',
      action: 'USER_AUTHENTICATION_SUCCESS',
      ipAddress: '10.240.12.19',
      details: 'Secure biometric SSO decryption approved for Commander Nexus Peak.'
    },
    {
      id: 'log-002',
      timestamp: new Date(Date.now() - 3600000 * 23).toISOString(),
      username: 'admin_nexus',
      role: 'NEXUS COMMANDER',
      action: 'SYSTEM_BOOTLOAD_SUCCESS',
      ipAddress: '10.240.12.19',
      details: 'AURA Secure Node_09 loaded with 12ms quantum-linked latency.'
    }
  ],
  settings: {
    activeRole: 'NEXUS COMMANDER',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    refreshIntervalSeconds: 30,
    emailAlertsEnabled: true,
    smsAlertsEnabled: false,
    desktopNotificationsEnabled: true,
    bypassHandshake: false,
    systemTheme: 'dark'
  }
};

class LocalDatabase {
  private db: DbSchema = DEFAULT_DB;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to initialize database, using memory-only database:", e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error("Failed to save database changes:", e);
    }
  }

  public get<K extends keyof DbSchema>(key: K): DbSchema[K] {
    return this.db[key];
  }

  public update<K extends keyof DbSchema>(key: K, data: DbSchema[K]): DbSchema[K] {
    this.db[key] = data;
    this.save();
    return this.db[key];
  }

  public logAction(username: string, role: string, action: string, details: string) {
    const logs = this.db.auditLogs;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username,
      role,
      action,
      ipAddress: '127.0.0.1',
      details
    };
    logs.unshift(newLog);
    // Keep logs list reasonable length
    if (logs.length > 200) logs.pop();
    this.update('auditLogs', logs);
  }
}

export const db = new LocalDatabase();
