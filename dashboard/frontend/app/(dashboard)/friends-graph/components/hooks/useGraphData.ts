'use client';

import { useEffect, useState } from 'react';
import type { GraphData } from '../types';

export function useGraphData(userId?: string) {
  const [data, setData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    async function fetchGraphData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/friends/graph/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }

        const graphData = await response.json();
        setData(graphData);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching graph data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGraphData();
  }, [userId]);

  return { data, isLoading, error };
}

