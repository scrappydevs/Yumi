/**
 * Liquid Glass UI Examples
 * 
 * Copy-paste examples showing how to use the liquid glass system.
 * Remove this file once you're familiar with the patterns.
 */

import { Search, Heart, Share2 } from 'lucide-react';

export function GlassExamples() {
  return (
    <div className="min-h-screen liquid-glass p-8 space-y-8">
      
      {/* Example 1: Glass Card */}
      <div className="panel-glass p-6 space-y-4 max-w-md">
        <div className="glass-highlight" />
        <h3 className="text-lg font-semibold text-slate-900">Glass Card</h3>
        <p className="text-sm text-slate-600">
          Beautiful card with liquid glass effect, backdrop blur, and animated highlight sweep.
        </p>
        <button className="btn-glass px-4 py-2 text-sm">
          Learn More
        </button>
      </div>

      {/* Example 2: Glass Search Bar */}
      <div className="liquid-glass-dark rounded-2xl p-3 flex items-center gap-3 shadow-panel max-w-md">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search something..."
          className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
        />
        <button className="btn-glass px-4 py-2 text-sm">Search</button>
      </div>

      {/* Example 3: Glass Buttons */}
      <div className="space-x-3">
        <button className="btn-glass px-6 py-3 text-sm font-medium">
          Standard Glass
        </button>
        <button className="glass-button px-6 py-3 text-sm font-medium">
          SVG Filter Glass
        </button>
        <button className="btn-glass gradient-purple-blue text-white px-6 py-3 text-sm font-medium">
          Glass + Gradient
        </button>
      </div>

      {/* Example 4: Glass Container with SVG Filter */}
      <div className="glass-container p-8 max-w-md space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Premium Glass</h3>
        <p className="text-slate-700">
          This uses advanced SVG filters for ultra-premium glass effects.
        </p>
        <div className="flex gap-2">
          <button className="glass-button p-3 rounded-full">
            <Heart className="w-5 h-5" />
          </button>
          <button className="glass-button p-3 rounded-full">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Example 5: Layered Glass */}
      <div className="liquid-glass rounded-3xl p-8 max-w-md">
        <div className="liquid-glass-dark rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Layered Glass
          </h3>
          <p className="text-sm text-slate-600">
            Multiple layers of glass create depth and hierarchy.
          </p>
        </div>
      </div>

      {/* Example 6: Glass with Ring */}
      <div className="panel-glass glass-ring p-6 max-w-md">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Glass with Ring Accent
        </h3>
        <p className="text-sm text-slate-600">
          Soft border rings add extra polish to glass surfaces.
        </p>
      </div>

      {/* Example 7: Glass Navigation */}
      <nav className="liquid-glass-dark rounded-2xl p-4 max-w-md">
        <div className="flex items-center justify-between">
          <div className="font-bold text-slate-900">Logo</div>
          <div className="flex gap-2">
            <button className="btn-glass px-4 py-2 text-sm">Home</button>
            <button className="btn-glass px-4 py-2 text-sm">About</button>
            <button className="btn-glass px-4 py-2 text-sm">Contact</button>
          </div>
        </div>
      </nav>

      {/* Example 8: Glass with Inner Glow */}
      <button className="panel-glass shadow-inner-glow px-8 py-4 max-w-md">
        <span className="text-lg font-semibold text-slate-900">
          Glass with Inner Glow
        </span>
      </button>

    </div>
  );
}

