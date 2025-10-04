'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart,
  Star,
  MapPin,
  DollarSign,
  Clock,
  Users,
  BookmarkPlus,
  Filter,
  Grid3x3,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock favorites data
const FAVORITES = [
  {
    id: 1,
    name: 'Nobu Downtown',
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=600&h=400&fit=crop',
    cuisine: 'Japanese',
    rating: 4.8,
    priceLevel: 4,
    location: 'Downtown NYC',
    visitCount: 7,
    lastVisit: '2 weeks ago',
    tags: ['Date Night', 'Special Occasion'],
    notes: 'Amazing black cod miso!',
  },
  {
    id: 2,
    name: 'Carbone',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop',
    cuisine: 'Italian',
    rating: 4.7,
    priceLevel: 4,
    location: 'Greenwich Village',
    visitCount: 5,
    lastVisit: '1 week ago',
    tags: ['Italian', 'Classic'],
    notes: 'Best spicy rigatoni vodka',
  },
  {
    id: 3,
    name: 'Momofuku Ko',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
    cuisine: 'Asian Fusion',
    rating: 4.6,
    priceLevel: 3,
    location: 'East Village',
    visitCount: 3,
    lastVisit: '3 days ago',
    tags: ['Casual', 'Innovative'],
    notes: 'Try the pork buns',
  },
  {
    id: 4,
    name: 'Cosme',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
    cuisine: 'Mexican',
    rating: 4.7,
    priceLevel: 3,
    location: 'Flatiron',
    visitCount: 4,
    lastVisit: '1 month ago',
    tags: ['Mexican', 'Modern'],
    notes: 'Duck carnitas are incredible',
  },
];

export default function FavoritesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="h-full p-8 overflow-y-auto bg-white">
      
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent mb-2">
                Favorites
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Your saved restaurants and must-visit spots
              </p>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-3">
              <div className="liquid-glass-dark rounded-xl p-1 flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`glass-btn-inline px-3 py-2 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'gradient-purple-blue text-white' : 'text-[hsl(var(--muted-foreground))]'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`glass-btn-inline px-3 py-2 rounded-lg transition-all ${
                    viewMode === 'list' ? 'gradient-purple-blue text-white' : 'text-[hsl(var(--muted-foreground))]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <motion.button
                className="glass-btn-inline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Filter className="w-4 h-4" />
                Filter
              </motion.button>
            </div>
          </div>

          {/* Stats - Inline Grid */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Saved', value: FAVORITES.length, icon: Heart },
              { label: 'Visits', value: 19, icon: MapPin },
              { label: 'Avg Rating', value: '4.7', icon: Star },
              { label: 'Wish List', value: 8, icon: BookmarkPlus },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="glass-card rounded-2xl p-4 relative overflow-hidden shadow-soft"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 text-[hsl(var(--primary))]" />
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Favorites Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-6' : 'space-y-4'}>
          {FAVORITES.map((restaurant, index) => (
            <motion.div
              key={restaurant.id}
              className="glass-card rounded-3xl overflow-hidden cursor-pointer group relative shadow-soft"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              whileHover={{ 
                scale: 1.02, 
                y: -4,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 12px 40px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Specular highlight on whole card */}
              <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-white/15 to-transparent pointer-events-none z-10 rounded-t-3xl" />
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Heart button */}
                <motion.button
                  className="absolute top-4 right-4 glass-btn"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </motion.button>

                {/* Stats overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">{restaurant.rating}</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm">
                      <span className="text-xs font-bold">{'$'.repeat(restaurant.priceLevel)}</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium">
                    {restaurant.cuisine}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.location}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{restaurant.visitCount} visits</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{restaurant.lastVisit}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {restaurant.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Notes */}
                {restaurant.notes && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] italic">
                      "{restaurant.notes}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

