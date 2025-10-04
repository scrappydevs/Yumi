'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="px-6 py-8 space-y-6">
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">Reports</CardTitle>
          <CardDescription className="uppercase text-xs tracking-wider">
            Generate and view system reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-[hsl(var(--muted-foreground))]">
            <div className="text-center space-y-3">
              <FileText className="w-12 h-12 mx-auto opacity-50" />
              <p className="text-sm uppercase tracking-wider">Reports Module</p>
              <p className="text-xs">Analytics reports and exports</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

