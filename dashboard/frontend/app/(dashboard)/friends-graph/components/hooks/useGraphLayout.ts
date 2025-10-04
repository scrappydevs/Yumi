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
  // Start with circular layout
  const radius = 300;
  const angle = (index / allFriends.length) * 2 * Math.PI;
  
  let x = Math.cos(angle) * radius + 500;
  let y = Math.sin(angle) * radius + 400;

  // Spring-based physics: distance = similarity
  // High similarity (0.9) → ideal distance = 110px (close)
  // Medium similarity (0.6) → ideal distance = 200px (medium)
  // Low similarity (0.3) → ideal distance = 290px (far)
  similarities.forEach((sim) => {
    if (sim.source === friend.id || sim.target === friend.id) {
      const otherUserId = sim.source === friend.id ? sim.target : sim.source;
      const otherIndex = allFriends.findIndex((f) => f.id === otherUserId);
      
      if (otherIndex !== -1) {
        // Calculate ideal distance based on similarity
        const idealDistance = 100 + (1.0 - sim.similarity_score) * 200;
        
        // Get other node's position
        const otherAngle = (otherIndex / allFriends.length) * 2 * Math.PI;
        const otherX = Math.cos(otherAngle) * radius + 500;
        const otherY = Math.sin(otherAngle) * radius + 400;
        
        // Calculate current distance
        const dx = otherX - x;
        const dy = otherY - y;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Spring force: pulls nodes to ideal distance
        if (currentDistance > 0) {
          const displacement = currentDistance - idealDistance;
          const force = displacement * sim.similarity_score * 0.3;
          
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

