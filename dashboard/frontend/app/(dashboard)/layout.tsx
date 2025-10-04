'use client';

import { useState, useEffect } from 'react';
import { AegisSidebar } from '@/components/aegis-sidebar';
import { AIPanel } from '@/components/ai-panel';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // const [aiPanelOpen, setAiPanelOpen] = useState(false); // Disabled - AI features coming soon
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
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] gradient-overlay">
      {/* Sidebar */}
      <AegisSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[hsl(var(--border))] liquid-glass">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
                  Discover
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className={`rounded-xl hover:bg-[hsl(var(--muted))] ${aiPanelOpen ? 'bg-[hsl(var(--muted))]' : ''}`}
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content with AI Panel */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          
          {/* AI Panel Sidebar */}
          <div 
            className={`h-full flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
              aiPanelOpen ? 'w-[400px]' : 'w-0'
            }`}
          >
            <div className="w-[400px] h-full">
              <AIPanel isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

