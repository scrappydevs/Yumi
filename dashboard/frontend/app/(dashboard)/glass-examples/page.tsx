'use client';

import { motion } from 'framer-motion';
import { Play, Pause, Heart, Share2, Download, Music } from 'lucide-react';

export default function GlassExamplesPage() {
  return (
    <div className="liquid-glass-demo">
      {/* SVG Filters for Liquid Glass Effect */}
      <svg className="hidden">
        <defs>
          {/* Container Glass Filter */}
          <filter id="container-glass" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="16 12" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"/>
            <feColorMatrix type="saturate" values="1.5" x="0%" y="0%" width="100%" height="100%" in="blur" result="colormatrix"/>
          </filter>

          {/* Button Glass Filter */}
          <filter id="btn-glass" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="8 6" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"/>
            <feColorMatrix type="saturate" values="1.75" x="0%" y="0%" width="100%" height="100%" in="blur" result="colormatrix"/>
          </filter>

          {/* Panel Glass Filter */}
          <filter id="panel-glass" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="20 15" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"/>
            <feColorMatrix type="saturate" values="2" x="0%" y="0%" width="100%" height="100%" in="blur" result="colormatrix"/>
          </filter>
        </defs>
      </svg>

      {/* Demo Content */}
      <div className="demo-content">
        {/* Example 1: Glass Container with Icon Button */}
        <motion.div 
          className="glass-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <button className="glass-btn" aria-label="Play">
            <Play className="w-full h-full" />
          </button>
        </motion.div>

        {/* Example 2: Music Player Controls */}
        <motion.div 
          className="glass-panel music-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="panel-content">
            <Music className="w-8 h-8 text-white mb-4" />
            <div className="flex gap-3">
              <button className="glass-btn-sm" aria-label="Previous">
                <Pause className="w-full h-full" />
              </button>
              <button className="glass-btn-sm" aria-label="Play">
                <Play className="w-full h-full" />
              </button>
              <button className="glass-btn-sm" aria-label="Next">
                <Heart className="w-full h-full" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Example 3: Social Actions */}
        <motion.div 
          className="glass-panel social-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="panel-content">
            <h3 className="text-white text-lg font-semibold mb-4">Share</h3>
            <div className="grid grid-cols-3 gap-3">
              <button className="glass-btn-sm" aria-label="Like">
                <Heart className="w-full h-full" />
              </button>
              <button className="glass-btn-sm" aria-label="Share">
                <Share2 className="w-full h-full" />
              </button>
              <button className="glass-btn-sm" aria-label="Download">
                <Download className="w-full h-full" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Example 4: Large Card */}
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="card-content">
            <h2 className="text-white text-2xl font-bold mb-2">Liquid Glass</h2>
            <p className="text-white/80 text-sm mb-4">
              Beautiful macOS-style glass morphism effect with SVG filters
            </p>
            <button className="glass-btn-inline">
              <Play className="w-5 h-5 mr-2" />
              <span className="text-white font-medium">Get Started</span>
            </button>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .liquid-glass-demo {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          font-weight: 300;
          background: url(https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/flowers.jpg) center center;
          background-size: 400px;
          min-height: 100vh;
          animation: moveBackground 60s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          overflow: auto;
        }

        .demo-content {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 40px;
          max-width: 1200px;
        }

        /* Glass Container */
        .glass-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 300px;
          height: 200px;
          border-radius: 30px;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .glass-container::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          border-radius: 30px;
          box-shadow: inset 2px 2px 0px -2px rgba(255, 255, 255, 0.7), 
                      inset 0 0 3px 1px rgba(255, 255, 255, 0.7);
        }

        .glass-container::after {
          content: '';
          position: absolute;
          z-index: -1;
          inset: 0;
          border-radius: 30px;
          backdrop-filter: blur(0px);
          filter: url(#container-glass);
          overflow: hidden;
          isolation: isolate;
        }

        /* Glass Button */
        .glass-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          width: 70px;
          height: 70px;
          padding: 15px;
          background: transparent;
          border-radius: 9999px;
          outline: none;
          border: none;
          z-index: 0;
          transition: transform 0.3s ease;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .glass-btn:hover {
          transform: scale(1.05);
        }

        .glass-btn:active {
          transform: scale(0.95);
        }

        .glass-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          border-radius: 9999px;
          box-shadow: inset 2px 2px 0px -2px rgba(255, 255, 255, 0.7), 
                      inset 0 0 3px 1px rgba(255, 255, 255, 0.7);
          background-color: rgb(255 255 255 / 10%);
        }

        .glass-btn::after {
          content: '';
          position: absolute;
          z-index: -1;
          inset: 0;
          border-radius: 9999px;
          backdrop-filter: blur(0px);
          filter: url(#btn-glass);
          overflow: hidden;
          isolation: isolate;
        }

        .glass-btn svg {
          width: 100%;
          height: 100%;
          stroke: #fff;
          fill: #fff;
          position: relative;
          z-index: 1;
        }

        /* Small Glass Button */
        .glass-btn-sm {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          width: 50px;
          height: 50px;
          padding: 12px;
          background: transparent;
          border-radius: 9999px;
          outline: none;
          border: none;
          transition: transform 0.3s ease;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .glass-btn-sm:hover {
          transform: scale(1.08);
        }

        .glass-btn-sm:active {
          transform: scale(0.92);
        }

        .glass-btn-sm::before {
          content: '';
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 9999px;
          box-shadow: inset 2px 2px 0px -2px rgba(255, 255, 255, 0.7), 
                      inset 0 0 3px 1px rgba(255, 255, 255, 0.7);
          background-color: rgb(255 255 255 / 10%);
        }

        .glass-btn-sm::after {
          content: '';
          position: absolute;
          z-index: -1;
          inset: 0;
          border-radius: 9999px;
          backdrop-filter: blur(0px);
          filter: url(#btn-glass);
          overflow: hidden;
          isolation: isolate;
        }

        .glass-btn-sm svg {
          width: 100%;
          height: 100%;
          stroke: #fff;
          fill: #fff;
          position: relative;
          z-index: 1;
        }

        /* Glass Panel */
        .glass-panel {
          position: relative;
          width: 280px;
          padding: 30px;
          border-radius: 30px;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .glass-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 30px;
          box-shadow: inset 2px 2px 0px -2px rgba(255, 255, 255, 0.7), 
                      inset 0 0 3px 1px rgba(255, 255, 255, 0.7);
        }

        .glass-panel::after {
          content: '';
          position: absolute;
          z-index: -1;
          inset: 0;
          border-radius: 30px;
          backdrop-filter: blur(0px);
          filter: url(#panel-glass);
          overflow: hidden;
          isolation: isolate;
        }

        .panel-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Glass Card */
        .glass-card {
          position: relative;
          width: 350px;
          padding: 40px;
          border-radius: 30px;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 30px;
          box-shadow: inset 2px 2px 0px -2px rgba(255, 255, 255, 0.7), 
                      inset 0 0 3px 1px rgba(255, 255, 255, 0.7);
        }

        .glass-card::after {
          content: '';
          position: absolute;
          z-index: -1;
          inset: 0;
          border-radius: 30px;
          backdrop-filter: blur(0px);
          filter: url(#panel-glass);
          overflow: hidden;
          isolation: isolate;
        }

        .card-content {
          position: relative;
          z-index: 1;
        }

        /* Inline Glass Button */
        .glass-btn-inline {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 12px 24px;
          background: transparent;
          border-radius: 9999px;
          outline: none;
          border: none;
          transition: transform 0.3s ease;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .glass-btn-inline:hover {
          transform: scale(1.05);
        }

        .glass-btn-inline:active {
          transform: scale(0.95);
        }

        .glass-btn-inline::before {
          content: '';
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 9999px;
          box-shadow: inset 2px 2px 0px -2px rgba(255, 255, 255, 0.7), 
                      inset 0 0 3px 1px rgba(255, 255, 255, 0.7);
          background-color: rgb(255 255 255 / 10%);
        }

        .glass-btn-inline::after {
          content: '';
          position: absolute;
          z-index: -1;
          inset: 0;
          border-radius: 9999px;
          backdrop-filter: blur(0px);
          filter: url(#btn-glass);
          overflow: hidden;
          isolation: isolate;
        }

        .glass-btn-inline svg {
          stroke: #fff;
          fill: #fff;
          position: relative;
          z-index: 1;
        }

        /* Animation */
        @keyframes moveBackground {
          from {
            background-position: 0% 0%;
          }
          to {
            background-position: 0% -1000%;
          }
        }

        /* Respect motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .liquid-glass-demo {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
