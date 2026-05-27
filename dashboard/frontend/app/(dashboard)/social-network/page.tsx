'use client';

import dynamic from 'next/dynamic';

const FriendsGraphFlow = dynamic(
  () => import('../friends-graph/FriendsGraphFlow'),
  { ssr: false }
);

export default function SocialNetworkPage() {
  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40">
      <div className="h-full flex flex-col">
        <div className="flex-1 px-8 pb-8">
          <FriendsGraphFlow />
        </div>
      </div>
    </div>
  );
}

