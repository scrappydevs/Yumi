'use client';

import type { MiniMapNodeProps } from '@xyflow/react';

export default function GraphMinimap({ x, y, selected }: MiniMapNodeProps) {
  return (
    <circle
      cx={x}
      cy={y}
      r={5}
      fill={selected ? '#9B87F5' : '#3B82F6'}
      stroke={selected ? '#7B61FF' : '#2563EB'}
      strokeWidth={1}
    />
  );
}

