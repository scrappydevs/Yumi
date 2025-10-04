'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Lazy load the map component for better initial page load
const RestaurantMapClean = dynamic(
  () => import('@/components/restaurant-map-clean').then((mod) => mod.RestaurantMapClean),
  {
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <motion.div 
            className="w-12 h-12 rounded-full gradient-purple-blue mx-auto mb-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading map...</p>
        </div>
      </div>
    ),
    ssr: false, // Disable SSR for map component
  }
);

export default function RestaurantMapPage() {
  return (
    <div className="h-full w-full">
      <RestaurantMapClean className="w-full h-full" />
    </div>
  );
}

