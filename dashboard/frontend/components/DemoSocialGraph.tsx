'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Node,
  Edge,
  ConnectionLineType,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TrendingUp, Utensils, Heart } from 'lucide-react';
import Image from 'next/image';

// Real users from your team with actual photos
const demoUsers = [
  { 
    id: '1', 
    name: 'Julian', 
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLaVo5tgYOgJB8aJ6Is7PEk70CXF5-CMS0bjWtjZYGcQVyQuBbD=s96-c',
    color: 'from-purple-400 to-indigo-500' 
  },
  { 
    id: '2', 
    name: 'Dheeraj', 
    avatar: '/assets/dheeraj.jpeg',
    color: 'from-blue-400 to-cyan-500' 
  },
  { 
    id: '3', 
    name: 'Aarush', 
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKq2eHEX_oilXygOCzDuPZCdvrcuy_GEuUAUeDqxXdq4zLpJoux=s96-c',
    color: 'from-green-400 to-emerald-500' 
  },
  { 
    id: '4', 
    name: 'Dhruv', 
    avatar: '/assets/dhruvghosh.jpeg',
    color: 'from-pink-400 to-rose-500' 
  },
  { 
    id: '5', 
    name: 'Krish', 
    avatar: '/assets/krishmody.jpeg',
    color: 'from-orange-400 to-amber-500' 
  },
  { 
    id: '6', 
    name: 'Shiva', 
    avatar: '/assets/shiva.jpeg',
    color: 'from-yellow-400 to-orange-400' 
  },
  { 
    id: '7', 
    name: 'Todd', 
    avatar: '/assets/todd.jpeg',
    color: 'from-teal-400 to-cyan-500' 
  },
  { 
    id: '8', 
    name: 'David', 
    avatar: '/assets/davidchung.jpeg',
    color: 'from-red-400 to-pink-500' 
  },
];

// Detailed sample similarities with food preferences
const demoSimilarities = [
  { 
    source: '1', target: '2', similarity: 0.85, 
    reason: 'Both love Italian cuisine and homemade pasta',
    cuisines: ['Italian', 'Mediterranean'],
    restaurants: 3
  },
  { 
    source: '1', target: '3', similarity: 0.72, 
    reason: 'Shared favorites: sushi, ramen, and Japanese sake',
    cuisines: ['Japanese', 'Asian Fusion'],
    restaurants: 2
  },
  { 
    source: '2', target: '4', similarity: 0.68, 
    reason: 'Similar taste profiles: umami-rich and savory dishes',
    cuisines: ['Korean', 'Chinese'],
    restaurants: 1
  },
  { 
    source: '3', target: '4', similarity: 0.91, 
    reason: 'Both love plant-based fine dining and organic food',
    cuisines: ['Vegan', 'Plant-Based', 'Farm-to-Table'],
    restaurants: 4
  },
  { 
    source: '3', target: '5', similarity: 0.79, 
    reason: 'Love Michelin-starred restaurants and wine pairings',
    cuisines: ['Fine Dining', 'French', 'Contemporary'],
    restaurants: 5
  },
  { 
    source: '4', target: '5', similarity: 0.64, 
    reason: 'Health-conscious with focus on organic, local ingredients',
    cuisines: ['Farm-to-Table', 'Organic'],
    restaurants: 2
  },
  { 
    source: '1', target: '5', similarity: 0.58, 
    reason: 'Weekend brunch lovers: avocado toast and mimosas',
    cuisines: ['Brunch', 'Breakfast', 'Café'],
    restaurants: 3
  },
  { 
    source: '2', target: '6', similarity: 0.76, 
    reason: 'BBQ and craft beer enthusiasts',
    cuisines: ['BBQ', 'American', 'Pub Food'],
    restaurants: 2
  },
  { 
    source: '5', target: '6', similarity: 0.62, 
    reason: 'Both enjoy seafood and coastal cuisine',
    cuisines: ['Seafood', 'Coastal'],
    restaurants: 2
  },
  { 
    source: '6', target: '7', similarity: 0.81, 
    reason: 'Street food lovers: tacos, bahn mi, and food trucks',
    cuisines: ['Mexican', 'Vietnamese', 'Street Food'],
    restaurants: 4
  },
  { 
    source: '3', target: '7', similarity: 0.69, 
    reason: 'Both love spicy food and experimenting with heat levels',
    cuisines: ['Thai', 'Indian', 'Spicy'],
    restaurants: 3
  },
  { 
    source: '4', target: '7', similarity: 0.73, 
    reason: 'Smoothie bowls and açaí enthusiasts',
    cuisines: ['Health Food', 'Juice Bar'],
    restaurants: 2
  },
  { 
    source: '1', target: '8', similarity: 0.77, 
    reason: 'Both love exploring new restaurants and food trends',
    cuisines: ['Fusion', 'Contemporary', 'Experimental'],
    restaurants: 4
  },
  { 
    source: '7', target: '8', similarity: 0.83, 
    reason: 'Korean BBQ and ramen lovers',
    cuisines: ['Korean', 'Japanese', 'Asian'],
    restaurants: 5
  },
  { 
    source: '6', target: '8', similarity: 0.66, 
    reason: 'Pizza and burger enthusiasts with craft beer',
    cuisines: ['American', 'Italian', 'Comfort Food'],
    restaurants: 3
  },
];

// Custom edge with tooltip (like auctor-1)
function DemoEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Get edge path and center position (like auctor-1)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(!showTooltip);
  };

  const edgeData = data as any;
  const similarity = edgeData?.similarity ?? 0;
  const reason = edgeData?.reason ?? '';
  const cuisines = edgeData?.cuisines ?? [];
  const restaurants = edgeData?.restaurants ?? 0;

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke={showTooltip ? 'rgba(99, 102, 241, 0.9)' : `rgba(155, 135, 245, ${similarity * 0.6})`}
        strokeWidth={showTooltip ? 3 : similarity * 3}
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          pointerEvents: 'stroke',
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={40}
        onClick={handleClick}
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
      />

      {/* Tooltip positioned at edge center (like auctor-1) */}
      {showTooltip && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 10}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="glass-panel p-4 rounded-xl shadow-2xl max-w-xs nodrag"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {(similarity * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-slate-600">match</span>
            </div>
            
            <p className="text-sm text-slate-700 mb-2">{reason}</p>
            
            {cuisines && cuisines.length > 0 && (
              <div className="flex items-center gap-1 mb-2 flex-wrap">
                <Utensils className="w-3 h-3 text-slate-600" />
                {cuisines.slice(0, 3).map((cuisine: string) => (
                  <span key={cuisine} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {cuisine}
                  </span>
                ))}
              </div>
            )}
            
            {restaurants > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Heart className="w-3 h-3 text-red-500" />
                <span>{restaurants} shared restaurant{restaurants !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Mini node component with handles and real avatars (like auctor-1)
function DemoNode({ data }: { data: any }) {
  const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left];
  
  return (
    <>
      {/* Handles at all sides for connections */}
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
      
      {/* Node visual with real avatar image */}
      <div
        className="relative"
        style={{
          width: '80px',
          height: '80px',
        }}
      >
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br ${data.color} 
            shadow-xl p-1 border-2 border-white/50 backdrop-blur-sm
            transition-transform duration-200 hover:scale-110`}
        >
          <Image
            src={data.avatar}
            alt={data.name}
            width={80}
            height={80}
            className="rounded-full w-full h-full object-cover"
            unoptimized
          />
        </div>
        {/* Name label below avatar */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-sm font-semibold text-slate-700 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
            {data.name}
          </span>
        </div>
      </div>
    </>
  );
}

const nodeTypes = {
  demo: DemoNode,
};

const edgeTypes = {
  demo: DemoEdge,
};

function DemoGraphInner() {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    // Create massive circular layout - takes up most of the viewport
    const radius = 350;
    const centerX = 450;
    const centerY = 450;
    
    const demoNodes: Node[] = demoUsers.map((user, index) => {
      const angle = (index / demoUsers.length) * 2 * Math.PI - Math.PI / 2; // Start from top
      return {
        id: user.id,
        type: 'demo',
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: {
          ...user,
        },
        draggable: false,
      };
    });

    const demoEdges: Edge[] = demoSimilarities.map((sim) => ({
      id: `${sim.source}-${sim.target}`,
      source: sim.source,
      target: sim.target,
      type: 'demo',
      data: sim,
      animated: true,
    }));

    setNodes(demoNodes);
    setEdges(demoEdges);

    // Fit view with minimal padding to maximize graph size
    setTimeout(() => fitView({ padding: 0.15, duration: 800 }), 100);
  }, [setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionLineType={ConnectionLineType.Bezier}
      fitView
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      className="pointer-events-auto"
    >
      <Background className="opacity-20" />
    </ReactFlow>
  );
}

export function DemoSocialGraph({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      <ReactFlowProvider>
        <DemoGraphInner />
      </ReactFlowProvider>
    </div>
  );
}

