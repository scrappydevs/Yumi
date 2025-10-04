'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import {
  Utensils,
  Compass,
  Users,
  MessageCircle,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookHeart,
  Activity,
  MapPin,
  LogOut,
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
  { name: 'Explore', icon: MapPin, href: '/spatial' },
  { name: 'Friends', icon: Users, href: '/friends' },
  { name: 'Favorites', icon: BookHeart, href: '/favorites' },
];

const secondaryNav: NavigationItem[] = [
  { name: 'Profile', icon: User, href: '/profile' },
  { name: 'Settings', icon: Settings, href: '/settings' },
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
        'relative h-screen transition-all duration-300 ease-in-out flex flex-col glass-layer-1 border-r border-white/20 overflow-hidden',
        isCollapsed ? 'w-[60px]' : 'w-[240px]'
      )}
      style={{
        width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
      }}
    >
      {/* Specular highlight */}
      <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="h-16 border-b border-[hsl(var(--border))] flex items-center justify-center px-4">
        <div className="flex items-center justify-center">
          <Utensils className="w-7 h-7" style={{
            background: 'linear-gradient(135deg, #9B87F5 0%, #7B61FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }} />
        </div>
      </div>

      {/* Toggle Button with Tooltip */}
      <Tooltip delayDuration={1000}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              'absolute -right-3 top-1/2 -translate-y-1/2 z-[100] h-6 w-6 rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-0 opacity-60 hover:opacity-100 hover:bg-[hsl(var(--muted))] transition-opacity duration-200'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
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
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = mounted && pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm font-medium transition-all hover:bg-[hsl(var(--muted))]',
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

        <Separator className="my-2 bg-[hsl(var(--border))]" />

        {secondaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = mounted && pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm font-medium transition-all hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
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

      {/* Footer - Logout Button */}
      <div className="border-t border-[hsl(var(--border))] p-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            'w-full text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))]',
            isCollapsed ? 'justify-center px-0' : 'justify-start gap-2'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}

