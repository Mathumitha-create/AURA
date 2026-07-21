import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import FloatingCopilotButton from '../components/FloatingCopilotButton';
import { UserSession } from '../types';

interface DashboardLayoutProps {
  session: UserSession;
  onLogout: () => void;
}

export default function DashboardLayout({ session, onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col overflow-hidden font-sans relative" id="aura-dashboard-frame">
      {/* Top Navbar Header */}
      <Navbar username={session.username} role={session.role} onLogout={onLogout} />

      {/* Main Content Workspace Layout */}
      <div className="flex-1 flex overflow-hidden" id="aura-workspace-body">
        {/* Collapsible Left Sidebar */}
        <Sidebar />

        {/* Routed Component Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#050B14] no-scrollbar relative" id="workspace-viewport">
          <Outlet />
        </main>
      </div>

      {/* Floating Executive Copilot Interface Drawer */}
      <FloatingCopilotButton />
    </div>
  );
}
