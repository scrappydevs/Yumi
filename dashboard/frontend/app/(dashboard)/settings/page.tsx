'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="px-6 py-8 space-y-6">
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">Settings</CardTitle>
          <CardDescription className="uppercase text-xs tracking-wider">
            Configure system preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-[hsl(var(--muted-foreground))]">
            <div className="text-center space-y-3">
              <SettingsIcon className="w-12 h-12 mx-auto opacity-50" />
              <p className="text-sm uppercase tracking-wider">Settings Module</p>
              <p className="text-xs">System configuration and preferences</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

