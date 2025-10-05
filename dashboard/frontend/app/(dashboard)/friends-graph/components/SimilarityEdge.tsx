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

  // Get edge path and center position
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
  const sharedRestaurants = data?.sharedRestaurants ?? [];
  const sharedCuisines = data?.sharedCuisines ?? [];
  const tasteOverlap = data?.tasteOverlap ?? {};

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔵 Edge CLICKED:', { 
      id, 
      source, 
      target, 
      similarityScore,
      sharedRestaurants,
      sharedCuisines,
      tasteOverlap
    });
    setIsSelected(!isSelected);
  }, [id, source, target, similarityScore, sharedRestaurants, sharedCuisines, tasteOverlap, isSelected]);

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

      {/* Detailed tooltip on click with shared data */}
      {isSelected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 50}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="nodrag"
          >
            <div
              style={{
                backdropFilter: 'blur(40px) saturate(180%)',
                background: 'rgba(255, 255, 255, 0.97)',
                border: '0.5px solid rgba(155, 135, 245, 0.3)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 8px 24px rgba(155, 135, 245, 0.3), 0 20px 40px rgba(99, 102, 241, 0.15)',
                borderRadius: '1rem',
                padding: '1rem 1.25rem',
                minWidth: '280px',
                maxWidth: '340px',
                animation: 'fadeInScale 0.2s ease',
              }}
            >
              {/* Explanation */}
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'rgb(71, 85, 105)', 
                  lineHeight: '1.5',
                  margin: 0,
                  fontWeight: '500',
                }}>
                  {explanation || 'Friends on Yumi'}
                </p>
              </div>

              {/* Shared Cuisines */}
              {sharedCuisines.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'rgb(139, 92, 246)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.375rem'
                  }}>
                    Shared Cuisines
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {sharedCuisines.map((cuisine, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: 'rgb(109, 40, 217)',
                          borderRadius: '0.375rem',
                          fontWeight: '500',
                        }}
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Restaurants */}
              {sharedRestaurants.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'rgb(139, 92, 246)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.375rem'
                  }}>
                    Shared Restaurants
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {sharedRestaurants.slice(0, 5).map((restaurant, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          color: 'rgb(71, 85, 105)',
                          padding: '0.25rem 0',
                        }}
                      >
                        • {restaurant.name}
                        {restaurant.cuisine && (
                          <span style={{ color: 'rgb(139, 92, 246)', marginLeft: '0.375rem' }}>
                            ({restaurant.cuisine})
                          </span>
                        )}
                      </div>
                    ))}
                    {sharedRestaurants.length > 5 && (
                      <div style={{ 
                        fontSize: '0.6875rem', 
                        color: 'rgb(139, 92, 246)', 
                        fontStyle: 'italic',
                        marginTop: '0.125rem'
                      }}>
                        +{sharedRestaurants.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shared Atmosphere */}
              {(tasteOverlap.shared_atmosphere?.length ?? 0) > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'rgb(139, 92, 246)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.375rem'
                  }}>
                    Shared Atmosphere
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {tasteOverlap.shared_atmosphere?.map((atm, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: 'rgb(109, 40, 217)',
                          borderRadius: '0.375rem',
                          fontWeight: '500',
                        }}
                      >
                        {atm.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Flavors */}
              {(tasteOverlap.shared_flavors?.length ?? 0) > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'rgb(139, 92, 246)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.375rem'
                  }}>
                    Shared Flavors
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {tasteOverlap.shared_flavors?.map((flavor, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: 'rgb(109, 40, 217)',
                          borderRadius: '0.375rem',
                          fontWeight: '500',
                        }}
                      >
                        {flavor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Compatibility */}
              {tasteOverlap.price_compatible !== undefined && tasteOverlap.price_compatible !== null && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'rgb(139, 92, 246)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.375rem'
                  }}>
                    💰 Price Compatibility
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    background: tasteOverlap.price_compatible ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: tasteOverlap.price_compatible ? 'rgb(109, 40, 217)' : 'rgb(239, 68, 68)',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    display: 'inline-block',
                  }}>
                    {tasteOverlap.price_compatible ? '✓ Compatible' : '✗ Different ranges'}
                  </div>
                </div>
              )}

              {/* Overall Match Score */}
              {tasteOverlap.overlap_score !== undefined && tasteOverlap.overlap_score > 0 && (
                <div style={{ 
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'rgb(139, 92, 246)',
                  }}>
                    Overall Taste Match: {(tasteOverlap.overlap_score * 100).toFixed(0)}%
                  </div>
                </div>
              )}

              {/* Empty state */}
              {sharedCuisines.length === 0 && 
               sharedRestaurants.length === 0 && 
               !(tasteOverlap.shared_atmosphere?.length ?? 0) &&
               !(tasteOverlap.shared_flavors?.length ?? 0) && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgb(148, 163, 184)',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '0.5rem 0'
                }}>
                  No shared preferences yet
                </div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(SimilarityEdge);
