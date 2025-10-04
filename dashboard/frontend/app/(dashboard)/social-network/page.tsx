'use client';

import dynamic from 'next/dynamic';

// Dynamically import FriendsGraphFlow to avoid SSR issues with ReactFlow
const FriendsGraphFlow = dynamic(
  () => import('../friends-graph/FriendsGraphFlow'),
  { ssr: false }
);

export default function SocialNetworkPage() {
  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6">
          <h1 className="text-4xl font-semibold text-[hsl(var(--foreground))] mb-1 tracking-tight">
            Social Network
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            Visualize your friend connections and taste similarities
          </p>
        </div>

        {/* Graph - takes remaining space */}
        <div className="flex-1 px-8 pb-8">
          <FriendsGraphFlow />
        </div>
      </div>
    </div>
  );
}

