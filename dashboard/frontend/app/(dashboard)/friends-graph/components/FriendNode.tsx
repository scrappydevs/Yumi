'use client';

import { useCallback, memo } from 'react';
import { NodeProps, Handle, Position, useReactFlow } from '@xyflow/react';
import Image from 'next/image';
import type { FriendNode } from './types';

function FriendNodeComponent({ id, selected, data }: NodeProps<FriendNode>) {
  const { name, avatarUrl, isCurrentUser, mutualFriends, similarityStats } = data;
  const { updateNodeData } = useReactFlow();

  const onAvatarLoad = useCallback(() => {
  }, []);

  const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left];

  return (
    <>
      {handlePositions.map((position) => (
        <Handle
          key={`${position}-source`}
          id={`${position}-source`}
          type="source"
          position={position}
          style={{ opacity: 0 }}
        />
      ))}
      {handlePositions.map((position) => (
        <Handle
          key={`${position}-target`}
          id={`${position}-target`}
          type="target"
          position={position}
          style={{ opacity: 0 }}
        />
      ))}

      <div
        className={`friend-node glass-panel transition-all duration-300 ${
          selected ? 'selected' : ''
        } ${isCurrentUser ? 'current-user' : ''}`}
      >
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

        <div className="friend-name">{name}</div>

        {(mutualFriends || 0) > 0 && (
          <div className="friend-stats">
            {mutualFriends} mutual
          </div>
        )}

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

