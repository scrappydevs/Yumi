'use client';

import { useCallback, memo } from 'react';
import { NodeProps, Handle, Position, useReactFlow } from '@xyflow/react';
import Image from 'next/image';
import type { FriendNode } from './types';

function FriendNodeComponent({ id, selected, data }: NodeProps<FriendNode>) {
  const { name, avatarUrl, isCurrentUser, mutualFriends, similarityStats } = data;
  const { updateNodeData } = useReactFlow();

  const onAvatarLoad = useCallback(() => {
    // Could update node size if needed
  }, []);

  // Handles at all 4 positions - both source and target for flexible connections
  const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left];

  return (
    <>
      {/* Source handles at all sides */}
      {handlePositions.map((position) => (
        <Handle
          key={`${position}-source`}
          id={`${position}-source`}
          type="source"
          position={position}
          style={{ opacity: 0 }}
        />
      ))}
      {/* Target handles at all sides */}
      {handlePositions.map((position) => (
        <Handle
          key={`${position}-target`}
          id={`${position}-target`}
          type="target"
          position={position}
          style={{ opacity: 0 }}
        />
      ))}

      {/* Node content with liquid glass */}
      <div
        className={`friend-node glass-panel transition-all duration-300 ${
          selected ? 'selected' : ''
        } ${isCurrentUser ? 'current-user' : ''}`}
      >
        {/* Avatar */}
        <div className="friend-avatar-container">
          <Image
            src={avatarUrl || '/default-avatar.png'}
            alt={name}
            width={60}
            height={60}
            className="friend-avatar"
            onLoad={onAvatarLoad}
          />
          {isCurrentUser && (
            <div className="current-user-badge" title="You" />
          )}
        </div>

        {/* Name label */}
        <div className="friend-name">{name}</div>

        {/* Stats */}
        {(mutualFriends || 0) > 0 && (
          <div className="friend-stats">
            {mutualFriends} mutual
          </div>
        )}

        {/* Similarity indicator - don't show for current user */}
        {!isCurrentUser && similarityStats && (
          <div className="similarity-indicator">
            <div
              className="similarity-bar"
              style={{
                width: `${similarityStats.avgSimilarity * 100}%`,
                backgroundColor: `rgba(155, 135, 245, ${0.5 + similarityStats.avgSimilarity * 0.5})`,
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default memo(FriendNodeComponent);

