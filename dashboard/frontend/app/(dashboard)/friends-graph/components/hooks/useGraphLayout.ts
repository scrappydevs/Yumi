'use client';

import { useCallback } from 'react';
import type { FriendNode, SimilarityEdgeType, GraphData } from '../types';

export function useGraphLayout() {
  const layoutNodes = useCallback(
    (
      friends: GraphData['friends'],
      similarities: GraphData['similarities']
    ): { nodes: FriendNode[]; edges: SimilarityEdgeType[] } => {
      // Proper iterative force-directed layout with similarity-based distances
      const positions = calculateForceDirectedLayout(friends, similarities);
      
      const nodes: FriendNode[] = friends.map((friend, idx) => ({
        id: friend.id,
        type: 'friend',
        position: positions[idx],
        data: {
          userId: friend.id,
          name: friend.display_name || friend.username,
          avatarUrl: friend.avatar_url || undefined,
          isCurrentUser: friend.is_current_user,
          mutualFriends: friend.mutual_friends_count || 0,
          similarityStats: calculateSimilarityStats(friend.id, similarities),
        },
      }));

      // Constant edge styling - distance encodes similarity
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

/**
 * Proper iterative force-directed layout simulation
 * This ensures that similarity-based distances are enforced through multiple iterations
 * until the system reaches equilibrium (unlike the previous single-pass approach)
 */
function calculateForceDirectedLayout(
  friends: GraphData['friends'],
  similarities: GraphData['similarities']
): { x: number; y: number }[] {
  const numNodes = friends.length;
  
  // Initialize positions in a circle
  const positions: { x: number; y: number }[] = [];
  const velocities: { x: number; y: number }[] = [];
  const radius = 400;
  const centerX = 600;
  const centerY = 500;
  
  for (let i = 0; i < numNodes; i++) {
    const angle = (i / numNodes) * 2 * Math.PI;
    positions.push({
      x: Math.cos(angle) * radius + centerX,
      y: Math.sin(angle) * radius + centerY,
    });
    velocities.push({ x: 0, y: 0 });
  }
  
  // Build adjacency map for faster lookups
  const adjacencyMap = new Map<string, Map<string, number>>();
  similarities.forEach((sim) => {
    if (!adjacencyMap.has(sim.source)) {
      adjacencyMap.set(sim.source, new Map());
    }
    if (!adjacencyMap.has(sim.target)) {
      adjacencyMap.set(sim.target, new Map());
    }
    adjacencyMap.get(sim.source)!.set(sim.target, sim.similarity_score);
    adjacencyMap.get(sim.target)!.set(sim.source, sim.similarity_score);
  });
  
  // Build index map
  const idToIndex = new Map<string, number>();
  friends.forEach((friend, idx) => {
    idToIndex.set(friend.id, idx);
  });
  
  // Simulation parameters
  const iterations = 250; // More iterations for better convergence
  const damping = 0.85; // Velocity damping to prevent oscillation
  const repulsionStrength = 8000; // Increased repulsion for more spacing
  const springStrength = 0.8; // Even stronger springs for dramatic effect
  
  // Run simulation
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate forces for each node
    const forces: { x: number; y: number }[] = positions.map(() => ({ x: 0, y: 0 }));
    
    // 1. Repulsion: All nodes repel each other (prevents overlap)
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        
        if (dist > 0) {
          // Coulomb's law: F = k / r^2
          const repulsion = repulsionStrength / distSq;
          const forceX = (dx / dist) * repulsion;
          const forceY = (dy / dist) * repulsion;
          
          forces[i].x -= forceX;
          forces[i].y -= forceY;
          forces[j].x += forceX;
          forces[j].y += forceY;
        }
      }
    }
    
    // 2. Attraction: Connected nodes attract based on similarity
    similarities.forEach((sim) => {
      const i = idToIndex.get(sim.source);
      const j = idToIndex.get(sim.target);
      
      if (i !== undefined && j !== undefined) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // ULTRA DRAMATIC ideal distance mapping:
        // High similarity = SUPER close, low similarity = FAR AWAY
        // 80% similarity → 90px (very close)
        // 68% similarity → 140px (close)
        // 50% similarity → 300px (medium)
        // 38% similarity → 550px (far)
        // 20% similarity → 850px (very far)
        const dissimilarity = 1.0 - sim.similarity_score;
        // Aggressive exponential curve with lower power = huge jumps at low similarity
        const idealDistance = 70 + Math.pow(dissimilarity, 0.4) * 1100;
        
        if (dist > 0) {
          // Hooke's law: F = k * (actual - ideal)
          const displacement = dist - idealDistance;
          // EXPONENTIAL spring weight: high similarity gets MUCH stronger springs
          const attraction = displacement * springStrength * (0.2 + Math.pow(sim.similarity_score, 2.0));
          const forceX = (dx / dist) * attraction;
          const forceY = (dy / dist) * attraction;
          
          forces[i].x += forceX;
          forces[i].y += forceY;
          forces[j].x -= forceX;
          forces[j].y -= forceY;
        }
      }
    });
    
    // 3. Apply forces to update velocities and positions
    for (let i = 0; i < numNodes; i++) {
      // Update velocity with damping
      velocities[i].x = (velocities[i].x + forces[i].x) * damping;
      velocities[i].y = (velocities[i].y + forces[i].y) * damping;
      
      // Update position
      positions[i].x += velocities[i].x;
      positions[i].y += velocities[i].y;
    }
  }
  
  return positions;
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

