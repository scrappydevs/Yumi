'use client';

import { useState, useEffect } from 'react';
import { AegisSidebar } from '@/components/aegis-sidebar';
import { AIPanel } from '@/components/ai-panel';
import { Button } from '@/components/ui/button';
import { Activity, Users, Sparkles } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+B / Ctrl+B for sidebar toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
      // Cmd+K / Ctrl+K for AI panel toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAiPanelOpen((prev) => !prev);
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
              <Button 
                variant="outline" 
                size="sm" 
                className={`border-[hsl(var(--border))] ${aiPanelOpen ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : ''}`}
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
              <Button variant="outline" size="sm" className="border-[hsl(var(--border))]">
                <Users className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content with AI Panel */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          
          {/* AI Panel */}
          {aiPanelOpen && (
            <div className="w-[400px] h-full flex-shrink-0">
              <AIPanel onClose={() => setAiPanelOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

