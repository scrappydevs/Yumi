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
  const [isHovered, setIsHovered] = useState(false);

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
  
  console.log('📊 Edge data:', { id, similarityScore, explanation, isHovered, data });

  const handleMouseEnter = useCallback(() => {
    console.log('🔵 Edge hover ENTER:', { id, source, target, similarityScore });
    setIsHovered(true);
  }, [id, source, target, similarityScore]);

  const handleMouseLeave = useCallback(() => {
    console.log('🔴 Edge hover LEAVE:', { id });
    setIsHovered(false);
  }, [id]);

  // Constant styling (like auctor-1) - distance encodes similarity
  const strokeWidth = 2;
  const edgeColor = isHovered ? `rgba(99, 102, 241, 0.8)` : `rgba(155, 135, 245, 0.4)`;

  return (
    <>
      {/* Invisible wide path for easier hovering */}
      <path
        id={`${id}-hitbox`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible edge - like auctor-1's BaseEdge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: isHovered ? 3 : strokeWidth,
          transition: 'all 0.2s ease-in-out',
        }}
      />

      {/* Hover tooltip with liquid glass */}
      {isHovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="glass-panel similarity-tooltip"
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

