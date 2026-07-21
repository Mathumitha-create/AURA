import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, ShieldCheck, Cpu, RefreshCw, 
  Terminal, ShieldAlert, Key, Save, Bell
} from 'lucide-react';

interface SystemSettings {
  activeRole: 'NEXUS COMMANDER' | 'JOINT COMMAND SECURITY' | 'GRID DEFENSE ANALYST';
  geminiApiKey: string;
  refreshIntervalSeconds: number;
  emailAlertsEnabled: boolean;
  smsAlertsEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  bypassHandshake: boolean;
  systemTheme: 'dark' | 'light' | 'tactical';
}

interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  role: string;
  action: string;
  ipAddress: string;
  details: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [activeRole, setActiveRole] = useState<'NEXUS COMMANDER' | 'JOINT COMMAND SECURITY' | 'GRID DEFENSE ANALYST'>('GRID DEFENSE ANALYST');
  const [apiKey, setApiKey] = useState('');
  const [intervalSec, setIntervalSec] = useState(30);
  const [emailAlert, setEmailAlert] = useState(true);
  const [smsAlert, setSmsAlert] = useState(false);
  const [desktopNotify, setDesktopNotify] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light' | 'tactical'>('dark');

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const fetchSettingsAndLogs = () => {
    setIsLoading(true);
    // Fetch Settings
    fetch('/api/dashboard?resource=settings')
      .then(r => r.json())
      .then((data: SystemSettings) => {
        setSettings(data);
        setActiveRole(data.activeRole);
        setApiKey(data.geminiApiKey);
        setIntervalSec(data.refreshIntervalSeconds);
        setEmailAlert(data.emailAlertsEnabled);
        setSmsAlert(data.smsAlertsEnabled);
        setDesktopNotify(data.desktopNotificationsEnabled);
        setTheme(data.systemTheme);
      })
      .catch(err => console.error("Failed to load settings:", err));

    // Fetch Audit Logs
    fetch('/api/dashboard?resource=audit')
      .then(r => r.json())
      .then(data => setAuditLogs(data))
      .catch(err => console.error("Failed to load audit logs:", err))
      .finally(() => setIsLoading(false));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    const updateObj = {
      activeRole,
      geminiApiKey: apiKey,
      refreshIntervalSeconds: intervalSec,
      emailAlertsEnabled: emailAlert,
      smsAlertsEnabled: smsAlert,
      desktopNotificationsEnabled: desktopNotify,
      systemTheme: theme
    };

    fetch('/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateSettings', settings: updateObj })
    })
      .then(r => r.json())
      .then((data) => {
        setSettings(data);
        setSaveSuccess(true);
        // Refresh logs to show settings audit
        fetch('/api/dashboard?resource=audit')
          .then(r => r.json())
          .then(logs => setAuditLogs(logs));
        setTimeout(() => setSaveSuccess(false), 2000);
      })
      .catch(err => console.error("Failed to save settings:", err));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="page-settings">
      {/* Page Header */}
      <div className="border-b border-border-grid pb-4 text-left">
        <h2 className="text-2xl font-sans font-bold tracking-wider text-white">System Settings</h2>
        <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">
          Command Credentials, Sensor Telemetry Intervals & Dashboard Audit Trails
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Settings Form Card */}
        <div className="xl:col-span-2 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSaveSettings} className="space-y-5 text-left font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1A2130] pb-3">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4 text-brand-gold" />
                <span className="font-bold text-white uppercase tracking-wider">NODE_CONFIGURATIONS</span>
              </div>
              <button
                type="submit"
                className="bg-brand-gold hover:bg-white text-black font-sans font-bold px-4 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer text-[10px] uppercase tracking-wider"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Profile</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded text-emerald-400 font-bold leading-normal">
                [SUCCESS] Configuration variables saved to system node. Audit log ledger generated.
              </div>
            )}

            {/* Config Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clearance Role Select */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Active Command Clearance Role</label>
                <select
                  value={activeRole}
                  onChange={(e: any) => setActiveRole(e.target.value)}
                  className="w-full bg-[#050B14] border border-[#252E3E] rounded p-2 text-[10px] font-mono text-white focus:outline-none focus:border-brand-gold/50 cursor-pointer"
                >
                  <option value="GRID DEFENSE ANALYST">Level 3: Grid Defense Analyst</option>
                  <option value="JOINT COMMAND SECURITY">Level 4: Joint Command Security</option>
                  <option value="NEXUS COMMANDER">Level 5: Nexus Commander (Full Release)</option>
                </select>
              </div>

              {/* Theme Select */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">System Color Theme</label>
                <select
                  value={theme}
                  onChange={(e: any) => setTheme(e.target.value)}
                  className="w-full bg-[#050B14] border border-[#252E3E] rounded p-2 text-[10px] font-mono text-white focus:outline-none focus:border-brand-gold/50 cursor-pointer"
                >
                  <option value="dark">Tactical Dark Mode</option>
                  <option value="tactical">Bloomberg Amber Monitor</option>
                </select>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider flex justify-between">
                  <span>Gemini Developer API Key</span>
                  {apiKey && <span className="text-emerald-400 font-bold">KEY_ACTIVE</span>}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                    <Key className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter GEMINI_API_KEY..."
                    className="w-full bg-[#050B14] border border-[#252E3E] rounded py-2 pl-9 pr-4 text-[10px] font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/50"
                  />
                </div>
              </div>

              {/* Sensor Interval slider */}
              <div className="space-y-1.5 md:col-span-2 border-t border-[#1A2130] pt-3">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Telemetry Sensor Refresh Interval</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                    className="flex-1 h-1 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-brand-gold"
                  />
                  <span className="font-bold text-white whitespace-nowrap min-w-[50px]">{intervalSec} Seconds</span>
                </div>
              </div>

              {/* Alert Channels checkboxes */}
              <div className="md:col-span-2 border-t border-[#1A2130] pt-3 space-y-3">
                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Security Alert Dispatch Channels</span>
                <div className="flex flex-wrap gap-4 font-mono text-[9px] text-gray-400">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={emailAlert}
                      onChange={(e) => setEmailAlert(e.target.checked)}
                      className="rounded border-[#252E3E] text-brand-gold h-3 w-3 accent-brand-gold cursor-pointer"
                    />
                    <span>Email Broadcasts</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={smsAlert}
                      onChange={(e) => setSmsAlert(e.target.checked)}
                      className="rounded border-[#252E3E] text-brand-gold h-3 w-3 accent-brand-gold cursor-pointer"
                    />
                    <span>SMS / Twilio Intercepts</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={desktopNotify}
                      onChange={(e) => setDesktopNotify(e.target.checked)}
                      className="rounded border-[#252E3E] text-brand-gold h-3 w-3 accent-brand-gold cursor-pointer"
                    />
                    <span>HUD Desktop Banners</span>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Audit Trail Card */}
        <div className="xl:col-span-1 bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-2xl flex flex-col h-[400px] justify-between font-mono text-xs text-left">
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 border-b border-[#1A2130] pb-3">
              <Terminal className="h-4 w-4 text-brand-gold animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">COMMAND_AUDIT_LOGS</span>
            </div>

            {/* Log Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[9px] text-gray-400 no-scrollbar max-h-[250px]">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-b border-[#1A2130]/50 pb-2 space-y-1">
                  <div className="flex justify-between text-[8px] text-gray-500">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span>{log.username} ({log.role.split(' ')[0]})</span>
                  </div>
                  <div className="text-gray-200 font-bold uppercase tracking-wider">{log.action}</div>
                  <p className="text-gray-400 leading-normal font-sans">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1A2130]/60 pt-3">
            <span className="text-[8px] text-gray-600 block text-center uppercase tracking-widest font-bold">AURA AUDIT ENVELOPE v4.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}




