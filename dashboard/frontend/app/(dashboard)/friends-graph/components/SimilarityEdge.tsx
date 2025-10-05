'use client';

import { useCallback, useState, memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import type { SimilarityEdgeType } from './types';

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
  
  // Parse JSON strings if needed (backend may return strings instead of arrays)
  const parseIfString = (value: any, fallback: any = []) => {
    if (!value) return fallback;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    return Array.isArray(value) ? value : fallback;
  };
  
  const parseObjectIfString = (value: any, fallback: any = {}) => {
    if (!value) return fallback;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    return typeof value === 'object' ? value : fallback;
  };
  
  const sharedRestaurants = parseIfString(data?.sharedRestaurants, []);
  const sharedCuisines = parseIfString(data?.sharedCuisines, []);
  const tasteOverlap = parseObjectIfString(data?.tasteOverlap, {});

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering pane click
    console.log('🔵 Edge CLICKED:', { 
      id, 
      source, 
      target, 
      similarityScore,
      explanation,
      sharedRestaurants,
      sharedCuisines,
      tasteOverlap,
    });
    setIsSelected(!isSelected);
  }, [id, source, target, similarityScore, explanation, sharedRestaurants, sharedCuisines, tasteOverlap, isSelected]);

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

      {/* Always visible similarity percentage label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
            zIndex: 10,
          }}
          className="nodrag"
        >
          <div
            style={{
              backdropFilter: 'blur(20px) saturate(150%)',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '0.5px solid rgba(155, 135, 245, 0.3)',
              boxShadow: '0 2px 8px rgba(155, 135, 245, 0.2)',
              borderRadius: '0.5rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgb(139, 92, 246)',
              whiteSpace: 'nowrap',
            }}
          >
            {(similarityScore * 100).toFixed(0)}%
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Detailed tooltip on hover/click */}
      {isSelected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 40}px)`,
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
                minWidth: '200px',
                maxWidth: '300px',
                animation: 'fadeInScale 0.2s ease',
              }}
            >
              {/* Explanation */}
              {explanation && (
                <p style={{ 
                  fontSize: '0.8125rem', 
                  color: 'rgb(71, 85, 105)', 
                  lineHeight: '1.4',
                  margin: '0 0 0.5rem 0',
                  fontWeight: 500,
                }}>
                  {explanation}
                </p>
              )}
              
              {/* Shared Restaurants */}
              {sharedRestaurants.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ 
                    fontSize: '0.6875rem', 
                    color: 'rgb(139, 92, 246)', 
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                  }}>
                    Shared Restaurants ({sharedRestaurants.length})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgb(100, 116, 139)' }}>
                    {sharedRestaurants.slice(0, 3).map((r: any, i: number) => (
                      <div key={i} style={{ marginBottom: '0.125rem' }}>
                        • {r.name || r.restaurant_name}
                      </div>
                    ))}
                    {sharedRestaurants.length > 3 && (
                      <div style={{ fontStyle: 'italic', marginTop: '0.25rem' }}>
                        +{sharedRestaurants.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Shared Cuisines */}
              {sharedCuisines.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ 
                    fontSize: '0.6875rem', 
                    color: 'rgb(139, 92, 246)', 
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                  }}>
                    Shared Cuisines
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.25rem',
                  }}>
                    {sharedCuisines.slice(0, 5).map((cuisine: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.6875rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.375rem',
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: 'rgb(139, 92, 246)',
                          fontWeight: 500,
                        }}
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Taste Profile Details */}
              {(tasteOverlap.shared_atmosphere?.length > 0 || 
                tasteOverlap.shared_flavors?.length > 0 || 
                tasteOverlap.price_compatible !== undefined) && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ 
                    fontSize: '0.6875rem', 
                    color: 'rgb(139, 92, 246)', 
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                  }}>
                    Taste Profile
                  </div>
                  
                  {/* Combined atmosphere, flavors, and price compatibility */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {/* Shared Atmosphere */}
                    {tasteOverlap.shared_atmosphere?.map((atm: string, i: number) => (
                      <span
                        key={`atm-${i}`}
                        style={{
                          fontSize: '0.6875rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.375rem',
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: 'rgb(139, 92, 246)',
                          fontWeight: 500,
                        }}
                      >
                        {atm}
                      </span>
                    ))}
                    
                    {/* Shared Flavors */}
                    {tasteOverlap.shared_flavors?.map((flavor: string, i: number) => (
                      <span
                        key={`flavor-${i}`}
                        style={{
                          fontSize: '0.6875rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.375rem',
                          background: 'rgba(236, 72, 153, 0.1)',
                          color: 'rgb(236, 72, 153)',
                          fontWeight: 500,
                        }}
                      >
                        {flavor}
                      </span>
                    ))}
                    
                    {/* Price Compatible Badge */}
                    {tasteOverlap.price_compatible !== undefined && tasteOverlap.price_compatible !== null && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.375rem',
                          background: tasteOverlap.price_compatible ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: tasteOverlap.price_compatible ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                          fontWeight: 500,
                        }}
                      >
                        {tasteOverlap.price_compatible ? '$ compatible' : '$ different'}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Fallback message */}
              {!explanation && sharedRestaurants.length === 0 && sharedCuisines.length === 0 && (
                <p style={{ 
                  fontSize: '0.8125rem', 
                  color: 'rgb(148, 163, 184)', 
                  fontStyle: 'italic',
                  margin: 0,
                }}>
                  Friends on Yumi
                </p>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(SimilarityEdge);

