import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';
import SignInScreen from './components/SignInScreen';
import DashboardLayout from './layout/DashboardLayout';
import CommandCenter from './pages/CommandCenter';
import DigitalTwin from './pages/DigitalTwin';
import ScenarioLab from './pages/ScenarioLab';
import Procurement from './pages/Procurement';
import SprManager from './pages/SprManager';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AiCopilotPage from './pages/AiCopilotPage';
import KnowledgeGraph from './pages/KnowledgeGraph';
import { UserSession } from './types';

export default function App() {
  const [appState, setAppState] = useState<'loading' | 'sign_in' | 'dashboard'>('loading');
  const [session, setSession] = useState<UserSession | null>(null);

  // Transition from bootloading to sign in gate
  const handleBootComplete = () => {
    setAppState('sign_in');
  };

  // Transition on authorized login
  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    setAppState('dashboard');
  };

  // Transition on log out / disconnect
  const handleLogout = () => {
    setSession(null);
    setAppState('sign_in');
  };

  return (
    <HashRouter>
      <main className="min-h-screen bg-[#050B14] text-white selection:bg-brand-gold selection:text-black">
        {appState === 'loading' && (
          <LoadingScreen onComplete={handleBootComplete} />
        )}

        {appState === 'sign_in' && (
          <SignInScreen onLoginSuccess={handleLoginSuccess} />
        )}

        {appState === 'dashboard' && session && (
          <Routes>
            <Route element={<DashboardLayout session={session} onLogout={handleLogout} />}>
              <Route path="/" element={<CommandCenter />} />
              <Route path="/digital-twin" element={<DigitalTwin />} />
              <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
              <Route path="/scenario" element={<ScenarioLab />} />
              <Route path="/procurement" element={<Procurement />} />
              <Route path="/spr" element={<SprManager />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/ai-copilot" element={<AiCopilotPage />} />
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        )}
      </main>
    </HashRouter>
  );
}
