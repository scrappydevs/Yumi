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

// Helper: Calculate position based on similarity to current user
// Higher similarity to current user = closer to center
function calculateForceDirectedPosition(
  friend: GraphData['friends'][0],
  allFriends: GraphData['friends'],
  similarities: GraphData['similarities'],
  index: number
) {
  const centerX = 600;
  const centerY = 500;
  
  // If this is the current user, place at center
  if (friend.is_current_user) {
    return { x: centerX, y: centerY };
  }
  
  // Find similarity score to current user
  let similarityToCurrentUser = 0.5; // default
  const currentUser = allFriends.find(f => f.is_current_user);
  
  if (currentUser) {
    const simRecord = similarities.find(
      sim => 
        (sim.source === currentUser.id && sim.target === friend.id) ||
        (sim.target === currentUser.id && sim.source === friend.id)
    );
    
    if (simRecord) {
      similarityToCurrentUser = simRecord.similarity_score;
    }
  }
  
  // Calculate distance from current user based on similarity
  // Higher similarity (0.8+) → distance = 200px (very close to center)
  // Medium similarity (0.5-0.7) → distance = 350px (medium distance)
  // Low similarity (0.3) → distance = 500px (far from center)
  // Formula: Higher similarity = CLOSER to current user
  const distanceFromCenter = 500 - (similarityToCurrentUser * 300);
  
  // Distribute friends in circular pattern around center
  const angle = (index / (allFriends.length - 1)) * 2 * Math.PI; // Exclude current user from count
  
  const x = centerX + Math.cos(angle) * distanceFromCenter;
  const y = centerY + Math.sin(angle) * distanceFromCenter;

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

