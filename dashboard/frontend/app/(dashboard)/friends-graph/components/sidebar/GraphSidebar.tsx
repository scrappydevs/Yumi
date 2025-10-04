'use client';

import { Info, TrendingUp, MapPin } from 'lucide-react';
import type { GraphData } from '../types';

interface GraphSidebarProps {
  selectedNode: string | null;
  graphData: GraphData | null;
}

export default function GraphSidebar({
  selectedNode,
  graphData,
}: GraphSidebarProps) {
  return (
    <div className="glass-panel graph-sidebar">
      <div className="sidebar-content">
        {/* How it works */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Visual Distance = Similarity
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Friends with similar tastes are positioned <strong>closer together</strong>. 
            Hover over edges to see why you match!
          </p>
          <div className="glass-panel p-2 mt-2">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Click nodes to view profiles</span>
            </div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Network Stats
          </h3>
          
          {graphData && (
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-value">{graphData.friends.length}</div>
                <div className="stat-label">Friends</div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-value">{graphData.similarities.length}</div>
                <div className="stat-label">Connections</div>
              </div>
                <div className="stat-card glass-panel">
                  <div className="stat-value">
                    {graphData.similarities.length > 0 ? (
                      (graphData.similarities.reduce((sum, s) => sum + (s.similarity_score || 0), 0) /
                      graphData.similarities.length) *
                      100
                    ).toFixed(0) : 0}%
                  </div>
                  <div className="stat-label">Avg Match</div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

