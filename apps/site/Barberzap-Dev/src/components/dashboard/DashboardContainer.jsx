import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, LogOut } from 'lucide-react';

export const DashboardContainer = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
