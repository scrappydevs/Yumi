'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  LayoutDashboard,
  Map,
  BarChart3,
  AlertCircle,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

const SIDEBAR_WIDTH_EXPANDED = '240px';
const SIDEBAR_WIDTH_COLLAPSED = '60px';

interface AegisSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

type NavigationItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
};

const navigation: NavigationItem[] = [
  { name: 'Overview', icon: LayoutDashboard, href: '/overview' },
  { name: 'Issues', icon: AlertCircle, href: '/issues' },
  { name: 'Spatial View', icon: Map, href: '/spatial' },
  { name: 'Reports', icon: FileText, href: '/reports' },
];

const secondaryNav: NavigationItem[] = [
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function AegisSidebar({ isCollapsed, onToggle }: AegisSidebarProps) {
  const pathname = usePathname();
  
  return (
    <aside
      className={cn(
        'relative h-screen border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-300 ease-in-out flex flex-col',
        isCollapsed ? 'w-[60px]' : 'w-[240px]'
      )}
      style={{
        width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
      }}
    >
      {/* Header */}
      <div className="h-16 border-b border-[hsl(var(--border))] flex items-center justify-between px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-[hsl(var(--primary))] rounded-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">
                AEGIS
              </h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                v2.1.0
              </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center w-8 h-8 bg-[hsl(var(--primary))] rounded-sm mx-auto">
            <Shield className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-20 z-50 h-6 w-6 rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-0 hover:bg-[hsl(var(--muted))]'
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-sm px-2 py-2 text-sm font-medium transition-all hover:bg-[hsl(var(--muted))]',
                isActive
                  ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
                isCollapsed && 'justify-center'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-sm bg-[hsl(var(--danger))] px-1.5 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        <Separator className="my-4 bg-[hsl(var(--border))]" />

        {secondaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-sm px-2 py-2 text-sm font-medium transition-all hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
                isActive
                  ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))]',
                isCollapsed && 'justify-center'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="flex-1">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[hsl(var(--border))] p-3">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
              <Activity className="h-3 w-3 text-[hsl(var(--success))]" />
              <span className="uppercase tracking-wider">System Online</span>
            </div>
            <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Last sync: 2 min ago
            </div>
            <div className="mt-3 pt-2 border-t border-[hsl(var(--border))]">
              <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                <kbd className="px-1 py-0.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded text-[9px] font-mono">
                  ⌘
                </kbd>
                <kbd className="px-1 py-0.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded text-[9px] font-mono">
                  B
                </kbd>
                <span className="ml-1">Toggle</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Activity className="h-4 w-4 text-[hsl(var(--success))]" />
          </div>
        )}
      </div>
    </aside>
  );
}

