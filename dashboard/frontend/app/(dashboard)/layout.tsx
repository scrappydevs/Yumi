'use client';

import { useState, useEffect } from 'react';
import { AegisSidebar } from '@/components/aegis-sidebar';
import { Button } from '@/components/ui/button';
import { Activity, Users } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Keyboard shortcut for sidebar toggle (Cmd+B / Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Sidebar */}
      <AegisSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--card))]/95">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Civic Infrastructure Intelligence</h1>
                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Municipal Operations Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Activity className="w-4 h-4" />
                <span className="uppercase tracking-wide text-xs">System Operational</span>
              </div>
              <Button variant="outline" size="sm" className="border-[hsl(var(--border))]">
                <Users className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

