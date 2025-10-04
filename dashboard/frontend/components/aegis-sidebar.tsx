'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import {
  Utensils,
  Compass,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  MapPin,
  LogOut,
  Calendar,
  Network,
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
  { name: 'Discover', icon: Compass, href: '/overview' },
  { name: 'Social Network', icon: Network, href: '/social-network' },
  { name: 'Friends', icon: Users, href: '/friends' },
  { name: 'Explore', icon: MapPin, href: '/spatial' },
  { name: 'Reservations', icon: Calendar, href: '/reservations' },
];

const secondaryNav: NavigationItem[] = [
  { name: 'Profile', icon: User, href: '/profile' },
];

export function AegisSidebar({ isCollapsed, onToggle }: AegisSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const supabase = createClient();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  
  return (
    <aside
      className={cn(
        'relative h-screen transition-all duration-300 ease-in-out flex flex-col z-[1000]',
        isCollapsed ? 'w-[60px]' : 'w-[240px]'
      )}
      style={{
        width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        borderRadius: 0,
        background: 'rgba(248, 250, 252, 0.25)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '0.25px solid rgba(148, 163, 184, 0.15)',
        boxShadow: 'inset 0 0 40px -10px rgba(155, 135, 245, 0.1), 0 8px 32px rgba(71, 85, 105, 0.08)',
      }}
    >
      {/* Specular highlight - softer purple/blue tint */}
      <div 
        className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(155, 135, 245, 0.08) 0%, transparent 100%)',
        }}
      />
      
      {/* Header */}
      <div className="h-16 border-b border-[hsl(var(--border))] flex items-center justify-center px-4">
        <div className="flex items-center justify-center mt-3">
          {/* Yummy Logo */}
          {!isCollapsed && (
            <img 
              src="/assets/yummylogo.png"
              alt="Yummy Logo" 
              className="h-36 w-36 object-contain"
            />
          )}
        </div>
      </div>

      {/* Toggle Button with Tooltip */}
      <Tooltip delayDuration={1000}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-[9999] h-6 w-6 rounded-full p-0 opacity-80 hover:opacity-100 transition-all duration-200 overflow-hidden"
            style={{
              backdropFilter: 'blur(24px) saturate(180%)',
              background: 'rgba(248, 250, 252, 0.2)',
              border: '0.25px solid rgba(148, 163, 184, 0.2)',
              boxShadow: 'inset 0 0 20px -6px rgba(155, 135, 245, 0.15), 0 4px 12px rgba(71, 85, 105, 0.12)',
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 text-gray-700" />
            ) : (
              <ChevronLeft className="h-3 w-3 text-gray-700" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          sideOffset={8} 
          className="!animate-none !zoom-in-0 !fade-in-0 data-[side=right]:!slide-in-from-left-0 !duration-0"
        >
          <span className="text-xs">⌘B to toggle</span>
        </TooltipContent>
      </Tooltip>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto relative z-10">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = mounted && pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all relative overflow-hidden',
                isActive
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-slate-700 hover:text-slate-900',
                isCollapsed && 'justify-center'
              )}
              style={isActive ? {
                backdropFilter: 'blur(24px) saturate(180%)',
                background: 'rgba(155, 135, 245, 0.15)',
                boxShadow: 'inset 0 0 24px -6px rgba(155, 135, 245, 0.2), 0 4px 12px rgba(155, 135, 245, 0.15)',
              } : {}}
            >
              <Icon className="h-4 w-4 flex-shrink-0 relative z-10" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 relative z-10">{item.name}</span>
                  {item.badge && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white relative z-10">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        <div className="my-2 h-[0.5px]" style={{
          background: 'rgba(148, 163, 184, 0.15)',
        }} />

        {secondaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = mounted && pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all relative overflow-hidden',
                isActive
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-slate-700 hover:text-slate-900',
                isCollapsed && 'justify-center'
              )}
              style={isActive ? {
                backdropFilter: 'blur(24px) saturate(180%)',
                background: 'rgba(155, 135, 245, 0.15)',
                boxShadow: 'inset 0 0 24px -6px rgba(155, 135, 245, 0.2), 0 4px 12px rgba(155, 135, 245, 0.15)',
              } : {}}
            >
              <Icon className="h-4 w-4 flex-shrink-0 relative z-10" />
              {!isCollapsed && <span className="flex-1 relative z-10">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Logout Button */}
      <div 
        className="relative z-50 p-2.5"
        style={{
          borderTop: '0.5px solid rgba(148, 163, 184, 0.15)',
          background: 'rgba(248, 250, 252, 0.15)',
          backdropFilter: 'blur(30px) saturate(180%)',
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            'w-full text-red-600 hover:text-red-700 rounded-xl transition-all relative overflow-hidden',
            isCollapsed ? 'justify-center px-0' : 'justify-start gap-2'
          )}
          style={{
            backdropFilter: 'blur(16px) saturate(160%)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.boxShadow = 'inset 0 0 20px -4px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(239, 68, 68, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}

