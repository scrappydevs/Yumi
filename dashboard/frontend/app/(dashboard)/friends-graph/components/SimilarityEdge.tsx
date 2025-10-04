'use client';

import { useCallback, useState, memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import type { SimilarityEdgeType } from './types';
import { Heart, Utensils, TrendingUp } from 'lucide-react';

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

  // Extract data first
  const similarityScore = data?.similarityScore ?? 0;
  const explanation = data?.explanation ?? '';
  const sharedRestaurants = data?.sharedRestaurants ?? [];
  const sharedCuisines = data?.sharedCuisines ?? [];
  const tasteOverlap = data?.tasteOverlap ?? {};
  
  console.log('📊 Edge data:', { id, similarityScore, explanation, isSelected, data });

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

      {/* Tooltip positioned at edge center (like auctor-1) */}
      {isSelected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 10}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="glass-panel similarity-tooltip nodrag"
          >
            {/* Score badge */}
            <div className="similarity-score-badge">
              <TrendingUp className="w-4 h-4" />
              <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
                {(similarityScore * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-slate-600">match</span>
            </div>

            {/* Explanation */}
            <p className="similarity-explanation">{explanation}</p>

            {/* Shared cuisines */}
            {sharedCuisines.length > 0 && (
              <div className="shared-items">
                <Utensils className="w-3 h-3 text-slate-600" />
                <div className="shared-cuisines">
                  {sharedCuisines.slice(0, 4).map((cuisine) => (
                    <span key={cuisine} className="cuisine-tag">
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Shared restaurants */}
            {sharedRestaurants.length > 0 && (
              <div className="shared-items">
                <Heart className="w-3 h-3 text-red-500" />
                <span className="text-xs text-slate-700">
                  {sharedRestaurants.length} shared restaurant{sharedRestaurants.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Taste overlap bars */}
            {Object.keys(tasteOverlap).length > 0 && (
              <div className="taste-overlap">
                {Object.entries(tasteOverlap).map(([taste, score]) => (
                  <div key={taste} className="taste-bar">
                    <span className="taste-label">{taste}</span>
                    <div className="taste-bar-bg">
                      <div
                        className="taste-bar-fill"
                        style={{ width: `${(score as number) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(SimilarityEdge);

