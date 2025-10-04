'use client';

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-md flex items-center justify-center font-bold text-black text-lg">
                iF
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">
                iFix
              </span>
            </div>

            {/* Nav Items */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Analytics
              </a>
              <a href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Settings
              </a>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-7xl font-light mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent tracking-tight">
            iFix Dashboard
          </h1>
          <p className="text-xl text-gray-400 font-normal tracking-normal">
            Intelligent infrastructure management and monitoring
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-800/50">
          <div className="flex space-x-1">
            {['overview', 'metrics', 'infrastructure', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 p-8 rounded-2xl hover:border-gray-700/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      System Status
                    </h3>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  </div>
                  <p className="text-5xl font-light text-white mb-2 tracking-tight">
                    99.9%
                  </p>
                  <p className="text-sm text-gray-500 font-normal">
                    Uptime this month
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 p-8 rounded-2xl hover:border-gray-700/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Active Users
                    </h3>
                    <span className="text-green-500 text-xs font-semibold">↑ 12%</span>
                  </div>
                  <p className="text-5xl font-light text-white mb-2 tracking-tight">
                    2,847
                  </p>
                  <p className="text-sm text-gray-500 font-normal">
                    Connected devices
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 p-8 rounded-2xl hover:border-gray-700/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Alerts
                    </h3>
                    <span className="text-yellow-500 text-xs font-semibold">! 3</span>
                  </div>
                  <p className="text-5xl font-light text-white mb-2 tracking-tight">
                    24
                  </p>
                  <p className="text-sm text-gray-500 font-normal">
                    Resolved today
                  </p>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 p-8 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-6 text-white tracking-tight">
                  Technology Stack
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⚛️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white tracking-tight">
                      Next.js
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-normal">
                      Modern React framework with TypeScript for type-safe development
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white tracking-tight">
                      FastAPI
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-normal">
                      High-performance Python backend with automatic API documentation
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🗄️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white tracking-tight">
                      Supabase
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-normal">
                      Database & authentication platform (pending setup)
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 p-8 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-6 text-white tracking-tight">
                  Quick Actions
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
                    Configure Environment
                  </button>
                  <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors border border-gray-700">
                    Setup Supabase
                  </button>
                  <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors border border-gray-700">
                    View Documentation
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'metrics' && (
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 p-12 rounded-2xl text-center">
              <h2 className="text-3xl font-semibold text-white mb-4 tracking-tight">
                Metrics Dashboard
              </h2>
              <p className="text-gray-400 text-lg font-normal">
                Performance metrics and analytics coming soon
              </p>
            </div>
          )}

          {activeTab === 'infrastructure' && (
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 p-12 rounded-2xl text-center">
              <h2 className="text-3xl font-semibold text-white mb-4 tracking-tight">
                Infrastructure Overview
              </h2>
              <p className="text-gray-400 text-lg font-normal">
                Infrastructure monitoring and management coming soon
              </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 p-12 rounded-2xl text-center">
              <h2 className="text-3xl font-semibold text-white mb-4 tracking-tight">
                Security Dashboard
              </h2>
              <p className="text-gray-400 text-lg font-normal">
                Security monitoring and alerts coming soon
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
