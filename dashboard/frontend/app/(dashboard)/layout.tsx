'use client';

import { useState, useEffect } from 'react';
import { AegisSidebar } from '@/components/aegis-sidebar';
import { AudioProvider, useAudio } from '@/lib/audio-context';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMuted, setIsMuted } = useAudio();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+B / Ctrl+B for sidebar toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-white text-[hsl(var(--foreground))]">
      {/* Sidebar */}
      <AegisSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isSpeaking={false}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      <DashboardContent>{children}</DashboardContent>
    </AudioProvider>
  );
}

