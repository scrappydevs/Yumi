'use client';

import { Interactive3DMap } from '@/components/interactive-3d-map';

export default function SpatialPage() {
  return (
    <div className="px-4 py-5 space-y-5 w-full">
      <div>
        <h2 className="text-sm font-medium tracking-tight text-[hsl(var(--foreground))]">
          Interactive 3D Spatial View
        </h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
          Navigate between cities and visualize issue clusters in real-time
        </p>
      </div>
      <Interactive3DMap />
    </div>
  );
}

