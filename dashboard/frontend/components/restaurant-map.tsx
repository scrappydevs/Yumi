'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { MapViewState } from '@deck.gl/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MapPin,
  Star,
  Clock,
  DollarSign,
  Phone,
  Globe,
  Navigation,
  X,
  ChevronRight,
  Sparkles,
  Heart,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Restaurant data type
type Restaurant = {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  cuisine: string;
  rating: number;
  priceLevel: number; // 1-4 dollar signs
  image: string;
  description: string;
  hours: string;
  phone: string;
  website: string;
  address: string;
  popularDishes: string[];
};

// Mock restaurant data - Replace with API call
const SAMPLE_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Nobu Downtown',
    coordinates: [-122.4194, 37.7749],
    cuisine: 'Japanese',
    rating: 4.8,
    priceLevel: 4,
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&h=600&fit=crop',
    description: 'Upscale Japanese-Peruvian fusion with signature sushi and elegant atmosphere',
    hours: '5:00 PM - 10:30 PM',
    phone: '(415) 555-0100',
    website: 'https://noburestaurants.com',
    address: '815 Market St, San Francisco, CA 94103',
    popularDishes: ['Black Cod Miso', 'Yellowtail Jalapeño', 'Rock Shrimp Tempura'],
  },
  {
    id: '2',
    name: 'State Bird Provisions',
    coordinates: [-122.4280, 37.7850],
    cuisine: 'American',
    rating: 4.7,
    priceLevel: 3,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    description: 'Inventive small plates served dim sum-style with a seasonal menu',
    hours: '5:30 PM - 10:00 PM',
    phone: '(415) 555-0200',
    website: 'https://statebirdsf.com',
    address: '1529 Fillmore St, San Francisco, CA 94115',
    popularDishes: ['State Bird', 'Pancakes', 'Duck Liver Mousse'],
  },
  {
    id: '3',
    name: 'La Taqueria',
    coordinates: [-122.4150, 37.7450],
    cuisine: 'Mexican',
    rating: 4.6,
    priceLevel: 1,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
    description: 'Mission-style burritos and tacos in a no-frills setting',
    hours: '11:00 AM - 9:00 PM',
    phone: '(415) 555-0300',
    website: 'https://lataqueria.com',
    address: '2889 Mission St, San Francisco, CA 94110',
    popularDishes: ['Carne Asada Burrito', 'Carnitas Tacos', 'Quesadilla'],
  },
  {
    id: '4',
    name: 'Zuni Café',
    coordinates: [-122.4230, 37.7720],
    cuisine: 'Mediterranean',
    rating: 4.5,
    priceLevel: 3,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
    description: 'Iconic SF spot known for roast chicken and oysters',
    hours: '11:30 AM - 10:00 PM',
    phone: '(415) 555-0400',
    website: 'https://zunicafe.com',
    address: '1658 Market St, San Francisco, CA 94102',
    popularDishes: ['Roast Chicken', 'Caesar Salad', 'Oysters'],
  },
  {
    id: '5',
    name: 'Tartine Bakery',
    coordinates: [-122.4200, 37.7610],
    cuisine: 'Bakery/Café',
    rating: 4.7,
    priceLevel: 2,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
    description: 'Legendary bakery with incredible bread and pastries',
    hours: '8:00 AM - 5:00 PM',
    phone: '(415) 555-0500',
    website: 'https://tartinebakery.com',
    address: '600 Guerrero St, San Francisco, CA 94110',
    popularDishes: ['Country Bread', 'Morning Bun', 'Croissant'],
  },
];

interface RestaurantMapProps {
  className?: string;
}

export function RestaurantMap({ className }: RestaurantMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [viewState, setViewState] = useState<MapViewState>({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 13,
    pitch: 45,
    bearing: 0,
  });

  // Filter restaurants based on search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return SAMPLE_RESTAURANTS.filter(r => 
      r.name.toLowerCase().includes(query) ||
      r.cuisine.toLowerCase().includes(query) ||
      r.address.toLowerCase().includes(query) ||
      r.popularDishes.some(dish => dish.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Handle restaurant selection
  const handleSelectRestaurant = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowSearchResults(false);
    setSearchQuery('');
    
    // Fly to restaurant location
    setViewState({
      latitude: restaurant.coordinates[1],
      longitude: restaurant.coordinates[0],
      zoom: 16,
      pitch: 60,
      bearing: 0,
      transitionDuration: 1500,
    });
  }, []);

  // Deck.gl layer for restaurants
  const layers = useMemo(() => {
    return [
      new ScatterplotLayer({
        id: 'restaurants-layer',
        data: SAMPLE_RESTAURANTS,
        pickable: true,
        opacity: 0.9,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 8,
        radiusMaxPixels: 20,
        lineWidthMinPixels: 2,
        getPosition: (d: Restaurant) => d.coordinates,
        getRadius: (d: Restaurant) => d.rating * 3,
        getFillColor: (d: Restaurant) => {
          // Purple-blue gradient based on rating
          if (d.rating >= 4.7) return [155, 135, 245, 255]; // Purple for high rated
          if (d.rating >= 4.5) return [139, 92, 246, 255]; // Mid purple
          return [96, 165, 250, 255]; // Blue
        },
        getLineColor: [255, 255, 255, 255],
        onClick: ({ object }) => object && handleSelectRestaurant(object),
      }),
    ];
  }, [handleSelectRestaurant]);

  const getPriceLevel = (level: number) => '$'.repeat(level);

  return (
    <div className={className}>
      <div className="relative h-[calc(100vh-80px)] overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pointer-events-none opacity-30" />
        
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState as MapViewState)}
          controller={true}
          layers={layers}
          getTooltip={({ object }) => {
            if (!object) return null;
            const restaurant = object as Restaurant;
            return {
              html: `
                <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(155, 135, 245, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 280px;">
                  <img src="${restaurant.image}" alt="${restaurant.name}" style="width: 100%; height: 120px; object-fit: cover;" />
                  <div style="padding: 12px;">
                    <div style="color: #1a1a1a; font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                      ${restaurant.name}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <span style="color: #9B87F5; font-size: 12px; font-weight: 500;">★ ${restaurant.rating}</span>
                      <span style="color: #999; font-size: 12px;">${restaurant.cuisine}</span>
                      <span style="color: #666; font-size: 12px;">${getPriceLevel(restaurant.priceLevel)}</span>
                    </div>
                    <div style="font-size: 11px; color: #6366f1; margin-top: 8px;">
                      Click to view details →
                    </div>
                  </div>
                </div>
              `,
              style: {
                backgroundColor: 'transparent',
                pointerEvents: 'none',
              },
            };
          }}
        >
          <Map
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
          />
        </DeckGL>

        {/* Bottom Search Bar - Apple Style Liquid Glass */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <motion.div
              className="relative rounded-[32px] p-[1px] shadow-2xl overflow-hidden"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {/* Gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 opacity-60" />
              
              <div className="relative bg-white/90 backdrop-blur-2xl rounded-[31px] p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(e.target.value.length > 0);
                    }}
                    placeholder="Search restaurants, cuisines, or dishes..."
                    className="w-full pl-12 pr-12 py-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 border-0 rounded-2xl 
                              text-base text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]
                              focus:outline-none focus:ring-2 focus:ring-purple-400/40
                              transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-3 space-y-2 max-h-[400px] overflow-y-auto"
                    >
                      {searchResults.map((restaurant) => (
                        <motion.button
                          key={restaurant.id}
                          onClick={() => handleSelectRestaurant(restaurant)}
                          className="w-full p-3 rounded-2xl bg-white/60 hover:bg-white/90 transition-all text-left
                                   border border-purple-100/50 hover:border-purple-200 hover:shadow-lg group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={restaurant.image}
                              alt={restaurant.name}
                              className="w-14 h-14 rounded-xl object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                                  {restaurant.name}
                                </h4>
                                <Badge className="bg-gradient-to-r from-purple-400 to-blue-400 text-white text-[10px]">
                                  {restaurant.cuisine}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{restaurant.rating}</span>
                                </div>
                                <span>•</span>
                                <span>{getPriceLevel(restaurant.priceLevel)}</span>
                                <span>•</span>
                                <span className="truncate">{restaurant.address.split(',')[0]}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-purple-400 transition-colors" />
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* No results */}
                {showSearchResults && searchResults.length === 0 && searchQuery && (
                  <div className="mt-3 p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No restaurants found. Try a different search.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Restaurant Detail Sidebar */}
        <AnimatePresence>
          {selectedRestaurant && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-4 right-4 w-[400px] max-h-[calc(100vh-120px)] overflow-y-auto"
            >
              {/* Gradient border wrapper */}
              <div className="relative rounded-[28px] p-[1px] shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400 opacity-70" />
                
                <div className="relative bg-white/95 backdrop-blur-2xl rounded-[27px] overflow-hidden">
                  {/* Hero Image */}
                  <div className="relative h-48">
                    <img
                      src={selectedRestaurant.image}
                      alt={selectedRestaurant.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    
                    {/* Close button */}
                    <button
                      onClick={() => setSelectedRestaurant(null)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm 
                               flex items-center justify-center hover:bg-white transition-all shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Rating badge */}
                    <div className="absolute bottom-3 left-3">
                      <div className="liquid-glass-dark px-3 py-1.5 rounded-full">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-white">{selectedRestaurant.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div>
                      <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">
                        {selectedRestaurant.name}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-gradient-to-r from-purple-400 to-blue-400 text-white">
                          {selectedRestaurant.cuisine}
                        </Badge>
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                          {getPriceLevel(selectedRestaurant.priceLevel)}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                      {selectedRestaurant.description}
                    </p>

                    {/* Popular Dishes */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          Popular Dishes
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedRestaurant.popularDishes.map((dish, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 
                                     text-xs font-medium text-[hsl(var(--foreground))] rounded-full
                                     border border-purple-100"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2.5 pt-3 border-t border-purple-100">
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-sm text-[hsl(var(--foreground))]">
                          {selectedRestaurant.address}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-sm text-[hsl(var(--foreground))]">
                          {selectedRestaurant.hours}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-sm text-[hsl(var(--foreground))]">
                          {selectedRestaurant.phone}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <a
                          href={selectedRestaurant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-500 hover:text-purple-600 hover:underline flex items-center gap-1"
                        >
                          Visit Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 
                                 text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Directions
                      </Button>
                      <Button
                        variant="outline"
                        className="border-purple-200 hover:bg-purple-50"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="border-purple-200 hover:bg-purple-50"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend - Top Right */}
        {!selectedRestaurant && (
          <div className="absolute top-4 right-4">
            <div className="relative rounded-2xl p-[1px] shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-blue-300 opacity-50" />
              <div className="relative bg-white/90 backdrop-blur-xl rounded-[15px] p-4">
                <div className="text-xs font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Rating Legend
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#9B87F5]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Exceptional (4.7+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Great (4.5+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#60A5FA]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Good</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Badge - Top Left */}
        <div className="absolute top-4 left-4">
          <div className="relative rounded-2xl p-[1px] shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-blue-300 opacity-50" />
            <div className="relative bg-white/90 backdrop-blur-xl rounded-[15px] px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[hsl(var(--foreground))]">
                    {SAMPLE_RESTAURANTS.length} Restaurants
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    San Francisco
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

