'use client';

import { Play, Pause, Heart, Share2, Download, Volume2, SkipBack, SkipForward } from 'lucide-react';

export default function LiquidGlassDemo() {
  return (
    <div className="h-full liquid-glass p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent mb-2">
            Liquid Glass Components
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Music Player & Social Action Panels with Glass Buttons
          </p>
        </div>

        {/* Component Showcase */}
        <div className="space-y-12">
          
          {/* Music Player Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Music Player Panel</h2>
            <div className="glass-panel music-panel max-w-sm">
              <button className="glass-btn-sm" title="Previous">
                <SkipBack className="w-4 h-4 text-slate-600" />
              </button>
              <button className="glass-btn-sm" title="Play">
                <Play className="w-4 h-4 text-slate-600" />
              </button>
              <button className="glass-btn-sm" title="Next">
                <SkipForward className="w-4 h-4 text-slate-600" />
              </button>
              <button className="glass-btn-sm" title="Volume">
                <Volume2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Social Actions Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Social Actions Panel</h2>
            <div className="glass-panel social-panel max-w-sm">
              <button className="glass-btn-sm" title="Like">
                <Heart className="w-4 h-4 text-slate-600" />
              </button>
              <button className="glass-btn-sm" title="Share">
                <Share2 className="w-4 h-4 text-slate-600" />
              </button>
              <button className="glass-btn-sm" title="Download">
                <Download className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Button Sizes</h2>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <button className="glass-btn-sm mb-2" title="Small Button">
                  <Play className="w-3 h-3 text-slate-600" />
                </button>
                <p className="text-xs text-slate-500">Small (50px)</p>
              </div>
              <div className="text-center">
                <button className="glass-btn mb-2" title="Large Button">
                  <Play className="w-6 h-6 text-slate-600" />
                </button>
                <p className="text-xs text-slate-500">Large (70px)</p>
              </div>
              <div className="text-center">
                <button className="glass-btn-inline mb-2">
                  <Play className="w-4 h-4 mr-2" />
                  Inline Button
                </button>
                <p className="text-xs text-slate-500">Inline with text</p>
              </div>
            </div>
          </div>

          {/* Mixed Layout Example */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Mixed Layout Example</h2>
            <div className="glass-panel p-6 max-w-md">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-2">
                  <button className="glass-btn-sm">
                    <Heart className="w-3 h-3 text-slate-600" />
                  </button>
                  <button className="glass-btn-sm">
                    <Share2 className="w-3 h-3 text-slate-600" />
                  </button>
                </div>
                <button className="glass-btn">
                  <Play className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* CSS Classes Reference */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">CSS Classes Reference</h2>
            <div className="glass-panel p-6 max-w-2xl">
              <div className="space-y-3 text-sm">
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">.glass-panel</code>
                  <span className="ml-2 text-slate-600">Base glass panel with backdrop blur and inner glow</span>
                </div>
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">.music-panel</code>
                  <span className="ml-2 text-slate-600">Music player panel with centered button layout</span>
                </div>
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">.social-panel</code>
                  <span className="ml-2 text-slate-600">Social actions panel with centered button layout</span>
                </div>
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">.glass-btn</code>
                  <span className="ml-2 text-slate-600">Large circular button (70px)</span>
                </div>
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">.glass-btn-sm</code>
                  <span className="ml-2 text-slate-600">Small circular button (50px)</span>
                </div>
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">.glass-btn-inline</code>
                  <span className="ml-2 text-slate-600">Inline button with text and padding</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
