'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeTypes,
  EdgeTypes,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  ReactFlowProvider,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './index.css';

import FriendNodeComponent from './components/FriendNode';
import SimilarityEdgeComponent, { SimilarityEdgeType } from './components/SimilarityEdge';
import GraphMinimap from './components/GraphMinimap';
import { UserDetailPanel } from './components/UserDetailPanel';
import { FriendNode } from './components/types';
import { useGraphData } from './components/hooks/useGraphData';
import { useGraphLayout } from './components/hooks/useGraphLayout';
import { createClient } from '@/lib/supabase/client';

// Register node types (like auctor-1)
type GraphNode = FriendNode;

const nodeTypes: NodeTypes = {
  friend: FriendNodeComponent,
};

const edgeTypes: EdgeTypes = {
  similarity: SimilarityEdgeComponent,
};

const proOptions = { account: 'paid-pro', hideAttribution: true };

function FriendsGraphFlow() {
  const [userId, setUserId] = useState<string | null>(null);
  const { fitView } = useReactFlow<GraphNode>();
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<SimilarityEdgeType>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    async function getCurrentUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getCurrentUser();
  }, []);

  // Fetch graph data (similar to auctor-1's canvas loading)
  const { data: graphData, isLoading } = useGraphData(userId || undefined);
  const { layoutNodes } = useGraphLayout();

  // Initialize graph when data loads - no filtering, distance = similarity
  useEffect(() => {
    if (graphData) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = layoutNodes(
        graphData.friends,
        graphData.similarities
      );
      
      console.log('🎨 Graph layout complete:', {
        nodes: layoutedNodes.length,
        edges: layoutedEdges.length,
        edgeData: layoutedEdges.map(e => ({ id: e.id, data: e.data }))
      });
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      // Fit view after layout (like auctor-1)
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [graphData, layoutNodes, setNodes, setEdges, fitView]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      console.log('👤 Node clicked:', node.id, node);
      setSelectedNode(node.id);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    console.log('🖱️ Pane clicked - clearing selections');
    setSelectedNode(null);
    // Note: Edge selections are managed internally by each edge component
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center liquid-glass">
        <div className="glass-panel p-8 rounded-2xl">
          <p className="text-slate-700">Loading friend network...</p>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.friends.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center liquid-glass">
        <div className="glass-panel p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold mb-2 text-slate-800">No Friends Yet</h2>
          <p className="text-slate-600">Add friends to see your food network!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineType={ConnectionLineType.Bezier}
          proOptions={proOptions}
          fitView
          className="liquid-glass"
        >
          <Background className="opacity-50" />
          <Controls className="glass-panel" />
          <MiniMap 
            nodeComponent={GraphMinimap}
            className="glass-panel rounded-lg"
            maskColor="rgba(248, 250, 252, 0.4)"
          />
        </ReactFlow>
      </div>
      
      {/* User detail panel overlay - fixed positioning, outside ReactFlow */}
      <UserDetailPanel
        userId={selectedNode}
        currentUserId={userId}
        onClose={() => setSelectedNode(null)}
      />
    </>
  );
}

// Wrapper with ReactFlowProvider (like auctor-1's ProExampleWrapper)
function FriendsGraphWrapper() {
  return (
    <ReactFlowProvider>
      <FriendsGraphFlow />
    </ReactFlowProvider>
  );
}

export default FriendsGraphWrapper;

