'use client';

import { useCallback, useState, memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import type { SimilarityEdgeType } from './types';
import { TrendingUp } from 'lucide-react';

export type { SimilarityEdgeType };

function SimilarityEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  source,
  target,
}: EdgeProps<SimilarityEdgeType>) {
  const [isSelected, setIsSelected] = useState(false);

  // Get edge path and center position (like auctor-1)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Extract data
  const similarityScore = data?.similarityScore ?? 0;
  const explanation = data?.explanation ?? '';

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering pane click
    console.log('🔵 Edge CLICKED:', { id, source, target, similarityScore });
    setIsSelected(!isSelected);
  }, [id, source, target, similarityScore, isSelected]);

  // Styling - highlight when selected
  const strokeWidth = isSelected ? 3 : 2;
  const edgeColor = isSelected ? `rgba(99, 102, 241, 0.9)` : `rgba(155, 135, 245, 0.4)`;

  return (
    <>
      {/* Visible edge with click detection */}
      <path
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={strokeWidth}
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          pointerEvents: 'stroke',
        }}
      />
      
      {/* Invisible wide hitbox for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          pointerEvents: 'stroke',
        }}
      />

      {/* Tooltip positioned at edge center - Simplified */}
      {isSelected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 10}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="nodrag"
          >
            <div
              style={{
                backdropFilter: 'blur(40px) saturate(180%)',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '0.5px solid rgba(155, 135, 245, 0.3)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 8px 24px rgba(155, 135, 245, 0.3), 0 20px 40px rgba(99, 102, 241, 0.15)',
                borderRadius: '1rem',
                padding: '0.75rem 1rem',
                minWidth: '180px',
                animation: 'fadeInScale 0.2s ease',
              }}
            >
              {/* Simple match display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp className="w-4 h-4" style={{ color: 'rgb(139, 92, 246)' }} />
                <span 
                  style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, rgb(139, 92, 246), rgb(99, 102, 241))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {(similarityScore * 100).toFixed(0)}%
                </span>
                <span style={{ fontSize: '0.875rem', color: 'rgb(100, 116, 139)' }}>match</span>
              </div>

              {/* Simple explanation */}
              <p style={{ 
                fontSize: '0.8125rem', 
                color: 'rgb(71, 85, 105)', 
                lineHeight: '1.4',
                margin: 0,
              }}>
                {explanation || 'Friends on Yummy'}
              </p>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(SimilarityEdge);

