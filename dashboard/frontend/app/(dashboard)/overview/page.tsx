'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Users,
  Sparkles,
  Send,
  Star,
  Navigation,
  ChevronDown,
  MessageSquare,
  Mic,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiquidGlassBlob } from '@/components/liquid-glass-blob';
import { MetallicSphereComponent } from '@/components/metallic-sphere';

// Mock restaurant data with food images
const SAMPLE_RESTAURANTS = [
  {
    id: 1,
    name: 'Nobu Downtown',
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=200&h=200&fit=crop',
    cuisine: 'Japanese',
    rating: 4.8,
    location: 'Downtown NYC',
  },
  {
    id: 2,
    name: 'Le Bernardin',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200&h=200&fit=crop',
    cuisine: 'French',
    rating: 4.9,
    location: 'Midtown',
  },
  {
    id: 3,
    name: 'Carbone',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop',
    cuisine: 'Italian',
    rating: 4.7,
    location: 'Greenwich Village',
  },
  {
    id: 4,
    name: 'Momofuku Ko',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop',
    cuisine: 'Asian Fusion',
    rating: 4.6,
    location: 'East Village',
  },
  {
    id: 5,
    name: 'Eleven Madison Park',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
    cuisine: 'American',
    rating: 4.9,
    location: 'Flatiron',
  },
  {
    id: 6,
    name: 'Cosme',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
    cuisine: 'Mexican',
    rating: 4.7,
    location: 'Flatiron',
  },
  {
    id: 7,
    name: 'Peter Luger',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=200&h=200&fit=crop',
    cuisine: 'Steakhouse',
    rating: 4.8,
    location: 'Brooklyn',
  },
  {
    id: 8,
    name: 'Blue Hill',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
    cuisine: 'American',
    rating: 4.7,
    location: 'Greenwich Village',
  },
  {
    id: 9,
    name: 'Gramercy Tavern',
    image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=200&h=200&fit=crop',
    cuisine: 'American',
    rating: 4.6,
    location: 'Gramercy',
  },
  {
    id: 10,
    name: 'Masa',
    image: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=200&h=200&fit=crop',
    cuisine: 'Japanese',
    rating: 4.9,
    location: 'Midtown',
  },
  {
    id: 11,
    name: 'Del Posto',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop',
    cuisine: 'Italian',
    rating: 4.5,
    location: 'Chelsea',
  },
  {
    id: 12,
    name: 'Lilia',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=200&h=200&fit=crop',
    cuisine: 'Italian',
    rating: 4.8,
    location: 'Williamsburg',
  },
  {
    id: 13,
    name: 'Ippudo',
    image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=200&h=200&fit=crop',
    cuisine: 'Ramen',
    rating: 4.5,
    location: 'Hell\'s Kitchen',
  },
  {
    id: 14,
    name: 'Daniel',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
    cuisine: 'French',
    rating: 4.8,
    location: 'Upper East Side',
  },
  {
    id: 15,
    name: 'Marea',
    image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=200&h=200&fit=crop',
    cuisine: 'Seafood',
    rating: 4.7,
    location: 'Midtown',
  },
  {
    id: 16,
    name: 'Contra',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop',
    cuisine: 'American',
    rating: 4.6,
    location: 'Lower East Side',
  },
  {
    id: 17,
    name: 'Sushi Nakazawa',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop',
    cuisine: 'Japanese',
    rating: 4.8,
    location: 'West Village',
  },
  {
    id: 18,
    name: 'The Modern',
    image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=200&h=200&fit=crop',
    cuisine: 'American',
    rating: 4.7,
    location: 'Midtown',
  },
  {
    id: 19,
    name: 'Osteria Morini',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=200&h=200&fit=crop',
    cuisine: 'Italian',
    rating: 4.6,
    location: 'SoHo',
  },
  {
    id: 20,
    name: 'Atoboy',
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&h=200&fit=crop',
    cuisine: 'Korean',
    rating: 4.7,
    location: 'NoMad',
  },
];

export default function DiscoverPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [location, setLocation] = useState('New York City');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [expandedOnce, setExpandedOnce] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Orbit animation - faster when thinking
    const interval = setInterval(() => {
      setRotation((prev) => (prev + (isThinking ? 1.2 : 0.4)) % 360);
    }, 50);
    
    return () => {
      clearInterval(interval);
    };
  }, [isThinking]);

  useEffect(() => {
    if (isThinking) {
      setExpandedOnce(true);
    }
  }, [isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Prompt:', prompt);
    // TODO: Implement natural language search
  };

  if (!mounted) {
  return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-white">
      
      {/* Test Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <motion.button
          onClick={() => setIsThinking(!isThinking)}
          className="glass-layer-1 px-4 py-2.5 rounded-full shadow-soft relative overflow-hidden flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
          <div className={`w-2 h-2 rounded-full ${isThinking ? 'gradient-purple-blue animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs font-medium">
            {isThinking ? 'Thinking...' : 'Test AI'}
          </span>
        </motion.button>
      </div>

      {/* Location Tagger - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <motion.div
          className="relative"
          initial={{ y: -10, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
          }}
          transition={{ 
            delay: 0.1,
            duration: 0.6,
            ease: "easeOut"
          }}
        >
          <motion.button
            className="glass-layer-1 pl-4 pr-5 py-3 rounded-full shadow-soft relative overflow-hidden flex items-center gap-2.5"
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Specular highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-full" />
            
            <div className="flex items-center gap-2 relative">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Navigation className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              </motion.div>
              <span className="text-sm font-semibold">{location}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
        </div>
          </motion.button>

          {/* Location Picker Dropdown */}
          <AnimatePresence>
            {showLocationPicker && (
              <motion.div
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-layer-1 rounded-2xl shadow-strong overflow-hidden"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ minWidth: '200px' }}
              >
                {/* Specular highlight */}
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                
                <div className="relative py-2">
                  {['New York City', 'San Francisco', 'Los Angeles', 'Chicago', 'Miami', 'Austin'].map((loc) => (
                    <motion.button
                      key={loc}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-white/40 transition-colors"
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationPicker(false);
                      }}
                      whileHover={{ x: 4 }}
                      style={{
                        background: location === loc ? 'linear-gradient(90deg, rgba(155, 135, 245, 0.15), transparent)' : 'transparent',
                      }}
                    >
                      {loc}
                    </motion.button>
                  ))}
        </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Main Content - Orbiting Photos with Center Dot */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative w-[700px] h-[700px]" style={{ perspective: '1000px' }}>
          
          {/* Three.js Blob - Always mounted, just hidden/shown */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ 
              opacity: isThinking ? 1 : 0,
              transition: 'opacity 0.01s ease-out',
              zIndex: isThinking ? 10 : -1,
            }}
          >
            {/* Vibrant purple-blue glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{
                scale: isThinking ? [1, 1.4, 1] : 1,
                opacity: isThinking ? [0.6, 0.8, 0.6] : 0,
                rotate: isThinking ? [0, 180, 360] : 0,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: 'radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.7), rgba(59, 130, 246, 0.6), transparent 70%)',
                filter: 'blur(80px)',
              }}
            />
            
            {/* Secondary glow - blue to purple */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{
                scale: isThinking ? [1.2, 1.5, 1.2] : 1,
                opacity: isThinking ? [0.5, 0.7, 0.5] : 0,
                rotate: isThinking ? [360, 180, 0] : 0,
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              style={{
                background: 'radial-gradient(circle at 70% 60%, rgba(96, 165, 250, 0.6), rgba(167, 139, 250, 0.5), transparent 70%)',
                filter: 'blur(90px)',
              }}
            />
            
            {/* Inner glow - directly behind blob */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{
                scale: isThinking ? [0.9, 1.1, 0.9] : 1,
                opacity: isThinking ? [0.8, 1, 0.8] : 0,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              style={{
                background: 'radial-gradient(circle at center, rgba(196, 181, 253, 0.8), rgba(147, 197, 253, 0.7), transparent 60%)',
                filter: 'blur(40px)',
              }}
            />
            
            <div className="w-[280px] h-[280px] relative">
              <LiquidGlassBlob isAnimating={isThinking} />
            </div>
            
            <motion.p
              className="text-sm font-semibold whitespace-nowrap text-center mt-6 bg-gradient-to-r from-[#FF375F] via-[#007AFF] to-[#5AC8FA] bg-clip-text text-transparent"
              animate={{
                opacity: isThinking ? [0.5, 1, 0.5] : 0,
                scale: isThinking ? [0.98, 1.02, 0.98] : 1,
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              Finding Restaurants
            </motion.p>
          </div>
          
          {/* Metallic Sphere - 3D, subtle and latent */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              opacity: isThinking ? 0 : 1,
              transition: 'opacity 0.01s ease-out',
              zIndex: 5,
            }}
          >
            {/* Primary glow - purple */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                opacity: [0.4, 0.6, 0.4],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: 'radial-gradient(circle at center, rgba(167, 139, 250, 0.5), rgba(139, 92, 246, 0.4), transparent 70%)',
                filter: 'blur(50px)',
              }}
            />
            
            {/* Secondary glow - blue */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1.1, 1.4, 1.1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              style={{
                background: 'radial-gradient(circle at center, rgba(96, 165, 250, 0.4), rgba(59, 130, 246, 0.3), transparent 70%)',
                filter: 'blur(60px)',
              }}
            />
            
            {/* Inner glow - directly behind sphere */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                opacity: [0.5, 0.7, 0.5],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              style={{
                background: 'radial-gradient(circle at center, rgba(196, 181, 253, 0.6), rgba(147, 197, 253, 0.5), transparent 60%)',
                filter: 'blur(30px)',
              }}
            />
            
            <div className="w-24 h-24 relative">
              <MetallicSphereComponent isActive={false} />
            </div>
          </div>

          {/* Orbiting Restaurant Photos - Dynamic Circle */}
          <AnimatePresence mode="sync">
          {(() => {
            // Always render all 20 restaurants, but control visibility
            // First 10 are the "core" images, next 10 fill in between
            return SAMPLE_RESTAURANTS.map((restaurant, index) => {
              const isCore = index < 10; // First 10 are core images
              const shouldShow = isCore || isThinking; // Show new images only when thinking
              
              // For core images: use their index (0-9)
              // For new images: interleave between core images (0.5, 1.5, 2.5, etc.)
              const effectiveIndex = isCore ? index : (index - 10) + 0.5;
              const totalSlots = isThinking ? 20 : 10;
              
              const angle = ((effectiveIndex / 10) * 360 + rotation) * (Math.PI / 180);
              const radius = isThinking ? 350 : 200; // Increased spacing when expanded
              const x = 350 + Math.cos(angle) * radius;
              const y = 350 + Math.sin(angle) * radius;
            
            if (!shouldShow) return null;
            
            return (
              <motion.div
                key={restaurant.id}
                className="absolute"
                initial={false}
                animate={{
                  left: x,
                  top: y,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  transition: { duration: 0.00 }
                }}
                transition={{
                  duration: 0.00,
                  ease: [0.22, 1, 0.36, 1], // Fast ease-out, no slow parts
                }}
                style={{
                  x: '-50%',
                  y: '-50%',
                }}
              >
                <motion.div
                  className="rounded-2xl p-2.5 shadow-medium cursor-pointer relative overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(30px) saturate(180%)',
                    border: '0.25px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: 'inset 0 0 30px -8px rgba(255, 255, 255, 0.9), 0 8px 28px rgba(0, 0, 0, 0.12)',
                    transformStyle: 'preserve-3d',
                  }}
                  initial={{ opacity: isCore ? 1 : 0, scale: isCore ? 1 : 0.8 }}
                  animate={{ 
                    opacity: 1,
                    scale: isThinking ? [1, 0.95, 1.02, 0.98, 1.01, 1] : 1,
                    rotateX: isThinking ? [0, 8, -5, 3, -2, 0] : 0,
                    rotateY: isThinking ? [0, -6, 8, -4, 2, 0] : 0,
                    rotateZ: isThinking ? [0, -3, 4, -2, 1, 0] : 0,
                    y: isThinking ? [0, -4, 2, -1, 1, 0] : 0,
                  }}
                  transition={isThinking ? {
                    delay: isCore ? 0 : 0.1,
                    scale: {
                      duration: 0.1 + index * 0.2,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1]
                    },
                    rotateX: {
                      duration: 0.1 + index * 0.25,
                      repeat: Infinity,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    },
                    rotateY: {
                      duration: 0.1 + index * 0.3,
                      repeat: Infinity,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    },
                    rotateZ: {
                      duration: 0.1 + index * 0.22,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1]
                    },
                    y: {
                      duration: 0.1 + index * 0.35,
                      repeat: Infinity,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }
                  } : {
                    duration: 0.05,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  whileHover={{ 
                    zIndex: 50,
                    boxShadow: 'inset 0 0 35px -8px rgba(255, 255, 255, 0.95), 0 16px 48px rgba(0, 0, 0, 0.2)',
                    transition: { duration: 0.3 }
                  }}
                  onClick={() => setSelectedRestaurant(restaurant.id)}
                >
                  {/* Inner specular highlight */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none rounded-t-2xl"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
                    }}
                  />
                  
                  <div className="relative group">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="object-cover rounded-xl"
                      style={{
                        width: '112px',
                        height: '112px',
                        minWidth: '112px',
                        minHeight: '112px',
                        maxWidth: '112px',
                        maxHeight: '112px',
                        boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
                      }}
                    />
                    {/* Info overlay */}
                    <motion.div 
                      className="absolute inset-0 rounded-xl flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      whileHover={{ 
                        opacity: 1,
                        transition: { duration: 0.2 }
                      }}
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.3), transparent)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-white text-[10px] font-bold truncate mb-0.5">
                          {restaurant.name}
              </div>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-white text-[9px] font-semibold">{restaurant.rating}</span>
                  </div>
                </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            );
            });
          })()}
          </AnimatePresence>
                  </div>
                </div>
                
      {/* Compact Search Bar - Minimal */}
      <div className="w-full max-w-3xl mb-8 z-10">
        <motion.div
          className="glass-layer-1 rounded-full h-14 px-4 shadow-strong relative overflow-hidden flex items-center gap-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
          }}
          transition={{ 
            delay: 0.15,
            duration: 0.8,
            ease: "easeOut"
          }}
        >
          {/* Animated specular highlight */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-full"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3 relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Where should we eat tonight?"
              className="flex-1 bg-transparent border-0 outline-none focus:outline-none text-sm placeholder:text-[hsl(var(--muted-foreground))]"
            />
            
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.6))',
                  backdropFilter: 'blur(12px)',
                  border: '0.5px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.05)',
                }}
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                <MessageSquare className="w-4 h-4 text-[hsl(var(--foreground))]" />
              </motion.button>
              
              <motion.button
                type="button"
                className="w-9 h-9 rounded-xl gradient-purple-blue flex items-center justify-center relative overflow-hidden"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 8px 20px rgba(0, 0, 0, 0.2)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                <Mic className="w-4 h-4 text-white" />
              </motion.button>
              </div>
          </form>
        </motion.div>
      </div>

      {/* Selected Restaurant Details Modal - Minimalist */}
      <AnimatePresence>
        {selectedRestaurant && (
          <motion.div
            className="absolute inset-0 bg-black/10 backdrop-blur-md flex items-center justify-center z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRestaurant(null)}
          >
            <motion.div
              className="glass-card rounded-[32px] p-8 max-w-lg w-full shadow-strong"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              
              {SAMPLE_RESTAURANTS.find(r => r.id === selectedRestaurant) && (
                <div className="relative">
                  <img
                    src={SAMPLE_RESTAURANTS.find(r => r.id === selectedRestaurant)!.image}
                    alt=""
                    className="w-full h-56 object-cover rounded-2xl mb-5 shadow-lg"
                  />
                  <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
                    {SAMPLE_RESTAURANTS.find(r => r.id === selectedRestaurant)!.name}
                  </h2>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold gradient-purple-blue text-white">
                      {SAMPLE_RESTAURANTS.find(r => r.id === selectedRestaurant)!.cuisine}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{SAMPLE_RESTAURANTS.find(r => r.id === selectedRestaurant)!.rating}</span>
          </div>
                    <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{SAMPLE_RESTAURANTS.find(r => r.id === selectedRestaurant)!.location}</span>
          </div>
          </div>
                  <motion.button 
                    className="w-full gradient-purple-blue text-white rounded-2xl h-12 text-base font-semibold shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reserve Table
                  </motion.button>
      </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
