'use client';

import type { Node, Edge } from '@xyflow/react';

export type FriendNodeData = {
  userId: string;
  name: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
  mutualFriends?: number;
  similarityStats?: {
    avgSimilarity: number;
    strongestConnection: string;
  };
};

export type FriendNode = Node<FriendNodeData, 'friend'>;

export type SimilarityEdgeData = {
  similarityScore: number;
  explanation: string;
  sharedRestaurants: Array<{
    place_id: string;
    name: string;
    cuisine?: string;
  }>;
  sharedCuisines: string[];
  tasteOverlap: {
    shared_atmosphere?: string[];
    shared_flavors?: string[];
    price_compatible?: boolean | null;
    overlap_score?: number;
  };
};

export type SimilarityEdgeType = Edge<SimilarityEdgeData, 'similarity'>;

export type GraphData = {
  friends: Array<{
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_current_user: boolean;
    mutual_friends_count?: number;
  }>;
  similarities: Array<{
    source: string;
    target: string;
    similarity_score: number;
    explanation: string;
    shared_restaurants?: any[];
    shared_cuisines?: string[];
    taste_profile_overlap?: any;
  }>;
};

