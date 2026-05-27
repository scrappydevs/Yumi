'use client';

import { useCallback } from 'react';
import type { FriendNode, SimilarityEdgeType, GraphData } from '../types';

export function useGraphLayout() {
  const layoutNodes = useCallback(
    (
      friends: GraphData['friends'],
      similarities: GraphData['similarities']
    ): { nodes: FriendNode[]; edges: SimilarityEdgeType[] } => {
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

function calculateForceDirectedPosition(
  friend: GraphData['friends'][0],
  allFriends: GraphData['friends'],
  similarities: GraphData['similarities'],
  index: number
) {
  const centerX = 600;
  const centerY = 500;
  
  if (friend.is_current_user) {
    return { x: centerX, y: centerY };
  }
  
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
  
  const baseDistance = 600;
  const exponent = 1.5;
  const distanceFromCenter = baseDistance * Math.pow((1 - similarityToCurrentUser), exponent);
  
  const angle = (index / (allFriends.length - 1)) * 2 * Math.PI; // Exclude current user from count
  
  const x = centerX + Math.cos(angle) * distanceFromCenter;
  const y = centerY + Math.sin(angle) * distanceFromCenter;

  return { x, y };
}

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

