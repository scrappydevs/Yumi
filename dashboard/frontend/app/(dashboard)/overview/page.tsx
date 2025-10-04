'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Users,
  Sparkles,
  Send,
  TrendingUp,
  Calendar,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock restaurant data with photos
const SAMPLE_RESTAURANTS = [
  {
    id: 1,
    name: 'Nobu Downtown',
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=400&h=400&fit=crop',
    cuisine: 'Japanese',
    rating: 4.8,
    location: 'Downtown NYC',
  },
  {
    id: 2,
    name: 'Le Bernardin',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop',
    cuisine: 'French',
    rating: 4.9,
    location: 'Midtown',
  },
  {
    id: 3,
    name: 'Carbone',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
    cuisine: 'Italian',
    rating: 4.7,
    location: 'Greenwich Village',
  },
  {
    id: 4,
    name: 'Momofuku Ko',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
    cuisine: 'Asian Fusion',
    rating: 4.6,
    location: 'East Village',
  },
  {
    id: 5,
    name: 'Eleven Madison Park',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
    cuisine: 'American',
    rating: 4.9,
    location: 'Flatiron',
  },
  {
    id: 6,
    name: 'Cosme',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
    cuisine: 'Mexican',
    rating: 4.7,
    location: 'Flatiron',
  },
];

export default function DiscoverPage() {
  const [prompt, setPrompt] = useState('');
  const [rotation, setRotation] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Only start rotation after mount to avoid hydration errors
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Prompt:', prompt);
    // TODO: Implement natural language search
  };

  const radius = 240;
  const centerX = 0;
  const centerY = 0;

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient - more prominent */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pointer-events-none" />
      
      {/* Simplified top badge */}
      <div className="absolute top-6 flex items-center justify-center w-full z-10">
        <div className="liquid-glass-dark px-5 py-2 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] animate-pulse" />
            <span className="text-xs font-semibold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
              12 friends dining nearby
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Photo Wheel */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Center Element - Minimalist Gradient Circle */}
        <motion.div
          className="absolute rounded-full w-32 h-32 flex flex-col items-center justify-center z-20 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
          }}
          animate={{
            scale: [1, 1.08, 1],
            rotate: [0, 360],
          }}
          transition={{
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          }}
        >
          <Sparkles className="w-8 h-8 text-white mb-1" />
          <span className="text-sm font-bold text-white">
            {SAMPLE_RESTAURANTS.length}
          </span>
          <span className="text-[10px] text-white/80 uppercase tracking-wider">
            spots
          </span>
        </motion.div>

        {/* Rotating Photos - Smaller & More Animated */}
        <div className="relative w-[550px] h-[550px]">
          {SAMPLE_RESTAURANTS.map((restaurant, index) => {
            const angle = (index * (360 / SAMPLE_RESTAURANTS.length) + rotation) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const scale = 0.9 + 0.1 * Math.sin(rotation * Math.PI / 180 + index);
            
            return (
              <motion.div
                key={restaurant.id}
                className="absolute cursor-pointer"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`,
                }}
                whileHover={{ 
                  scale: 1.2, 
                  zIndex: 30,
                  rotate: [0, -5, 5, 0],
                }}
                transition={{
                  rotate: { duration: 0.3 }
                }}
                onClick={() => setSelectedRestaurant(restaurant.id)}
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/20 to-blue-400/20 blur-xl" />
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-20 h-20 object-cover rounded-2xl shadow-2xl relative border-2 border-white/50"
                  />
                  <motion.div 
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full gradient-purple-blue flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.2 }}
                  >
                    <Star className="w-4 h-4 fill-white text-white" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Prompt Panel - Minimalist Gradient */}
      <div className="w-full max-w-2xl mb-6 z-10">
        <motion.div
          className="relative rounded-[32px] p-[1px] shadow-2xl overflow-hidden"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          {/* Gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 opacity-60" />
          
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-[31px] p-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Where should we eat? Try natural language..."
                  className="w-full px-5 py-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 border-0 rounded-2xl 
                            resize-none text-sm leading-relaxed
                            text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]
                            focus:outline-none focus:ring-2 focus:ring-purple-400/40
                            transition-all"
                  rows={2}
                />
                <motion.button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="absolute right-2 bottom-2 rounded-xl gradient-purple-blue text-white h-9 px-5 
                            shadow-lg disabled:opacity-40 font-medium text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Quick Action Chips - Gradient style */}
              <div className="flex flex-wrap gap-2">
                <motion.button
                  type="button"
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 text-xs font-medium transition-all"
                  onClick={() => setPrompt('Show me trendy spots my friends have been to')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Users className="w-3 h-3 inline mr-1" />
                  Friends
                </motion.button>
                <motion.button
                  type="button"
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-xs font-medium transition-all"
                  onClick={() => setPrompt('Find restaurants open now near me')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Nearby
                </motion.button>
                <motion.button
                  type="button"
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-xs font-medium transition-all"
                  onClick={() => setPrompt('Surprise me with something new')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Surprise
                </motion.button>
              </div>
            </form>
          </div>
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
              className="relative bg-white/95 backdrop-blur-2xl rounded-[32px] p-8 max-w-lg w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400 opacity-20 blur-xl" />
              
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
