'use client';

import { useCallback } from 'react';
import type { FriendNode, SimilarityEdgeType, GraphData } from '../types';

export function useGraphLayout() {
  const layoutNodes = useCallback(
    (
      friends: GraphData['friends'],
      similarities: GraphData['similarities']
    ): { nodes: FriendNode[]; edges: SimilarityEdgeType[] } => {
      // Force-directed layout with similarity-based distances
      const nodes: FriendNode[] = friends.map((friend, idx) => {
        const position = calculateForceDirectedPosition(
          friend,
          friends,
          similarities,
          idx
        );

        return {
          id: friend.id,
          type: 'friend',
          position,
          data: {
            userId: friend.id,
            name: friend.display_name || friend.username,
            avatarUrl: friend.avatar_url || undefined,
            isCurrentUser: friend.is_current_user,
            mutualFriends: friend.mutual_friends_count || 0,
            similarityStats: calculateSimilarityStats(friend.id, similarities),
          },
        };
      });

      // Constant edge styling - distance encodes similarity (like auctor-1)
      const edges: SimilarityEdgeType[] = similarities.map((sim) => ({
        id: `${sim.source}-${sim.target}`,
        source: sim.source,
        target: sim.target,
        type: 'similarity',
        style: {
          strokeWidth: 2,
          stroke: `rgba(155, 135, 245, 0.4)`,
        },
        data: {
          similarityScore: sim.similarity_score,
          explanation: sim.explanation,
          sharedRestaurants: sim.shared_restaurants || [],
          sharedCuisines: sim.shared_cuisines || [],
          tasteOverlap: sim.taste_profile_overlap || {},
        },
      }));

      return { nodes, edges };
    },
    []
  );

  // No longer filter by similarity - show all edges with constant styling
  // Distance between nodes represents similarity
  const layoutEdges = useCallback(
    (similarities: GraphData['similarities']): SimilarityEdgeType[] => {
      return similarities.map((sim) => ({
        id: `${sim.source}-${sim.target}`,
        source: sim.source,
        target: sim.target,
        type: 'similarity',
        style: {
          strokeWidth: 2,
          stroke: `rgba(155, 135, 245, 0.4)`,
        },
        data: {
          similarityScore: sim.similarity_score,
          explanation: sim.explanation,
          sharedRestaurants: sim.shared_restaurants || [],
          sharedCuisines: sim.shared_cuisines || [],
          tasteOverlap: sim.taste_profile_overlap || {},
        },
      }));
    },
    []
  );

  return { layoutNodes, layoutEdges };
}

// Helper: Calculate force-directed position with spring physics (like auctor-1)
// Uses ideal distance based on similarity - more similar = closer together
function calculateForceDirectedPosition(
  friend: GraphData['friends'][0],
  allFriends: GraphData['friends'],
  similarities: GraphData['similarities'],
  index: number
) {
  // Start with circular layout (MUCH LARGER radius to prevent overlap)
  const radius = 500; // Increased from 300 to 500 for more spacing
  const angle = (index / allFriends.length) * 2 * Math.PI;
  
  let x = Math.cos(angle) * radius + 600;
  let y = Math.sin(angle) * radius + 500;

  // Spring-based physics: distance = similarity (STRONGER force for visibility)
  // High similarity (0.8+) → ideal distance = 250px (close but not overlapping)
  // Medium similarity (0.5-0.7) → ideal distance = 400px (medium)
  // Low similarity (0.3) → ideal distance = 550px (far apart)
  similarities.forEach((sim) => {
    if (sim.source === friend.id || sim.target === friend.id) {
      const otherUserId = sim.source === friend.id ? sim.target : sim.source;
      const otherIndex = allFriends.findIndex((f) => f.id === otherUserId);
      
      if (otherIndex !== -1) {
        // Calculate ideal distance: Higher similarity = SMALLER distance (closer nodes)
        // Formula: as similarity goes from 0→1, distance goes from 550px→250px
        const idealDistance = 550 - (sim.similarity_score * 300);
        
        // Get other node's position (use same radius and center as above)
        const otherAngle = (otherIndex / allFriends.length) * 2 * Math.PI;
        const otherX = Math.cos(otherAngle) * radius + 600;
        const otherY = Math.sin(otherAngle) * radius + 500;
        
        // Calculate current distance
        const dx = otherX - x;
        const dy = otherY - y;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Spring force: pulls nodes to ideal distance
        if (currentDistance > 0) {
          const displacement = currentDistance - idealDistance;
          // Apply force to move toward ideal distance (no similarity weighting to avoid oscillation)
          const force = displacement * 0.5; // Balanced force for all pairs
          
          const forceX = (dx / currentDistance) * force;
          const forceY = (dy / currentDistance) * force;
          
          x += forceX;
          y += forceY;
        }
      }
    }
  });

  return { x, y };
}

// Helper: Calculate stats for a node
function calculateSimilarityStats(
  userId: string,
  similarities: GraphData['similarities']
) {
  const userSims = similarities.filter(
    (sim) => sim.source === userId || sim.target === userId
  );

  if (userSims.length === 0) return undefined;

  const avgSimilarity =
    userSims.reduce((sum, sim) => sum + sim.similarity_score, 0) / userSims.length;

  const strongest = userSims.reduce((max, sim) =>
    sim.similarity_score > max.similarity_score ? sim : max
  );

  return {
    avgSimilarity,
    strongestConnection: strongest.explanation,
  };
}

