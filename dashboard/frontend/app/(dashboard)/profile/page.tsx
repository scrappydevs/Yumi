'use client';

import { motion } from 'framer-motion';
import { 
  MapPin,
  Star,
  Calendar,
  Utensils,
  Heart,
  Users,
  Share2,
  Settings,
  Clock,
  TrendingUp,
} from 'lucide-react';

// Mock user data
const USER = {
  name: 'Julian Ng-Thow-Hing',
  username: '@julian',
  avatar: 'https://i.pravatar.cc/200?img=68',
  bio: 'Food enthusiast | NYC explorer | Always looking for the next great meal 🍜',
  stats: {
    totalVisits: 127,
    totalRestaurants: 89,
    friendCount: 47,
    favoriteCount: 34,
  },
};

// Restaurant visit history
const VISIT_HISTORY = [
  { id: 1, name: 'Nobu Downtown', date: '3 days ago', rating: 5, image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=100&h=100&fit=crop' },
  { id: 2, name: 'Carbone', date: '1 week ago', rating: 5, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=100&h=100&fit=crop' },
  { id: 3, name: 'Momofuku Ko', date: '2 weeks ago', rating: 4, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&h=100&fit=crop' },
  { id: 4, name: 'Le Bernardin', date: '3 weeks ago', rating: 5, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=100&h=100&fit=crop' },
  { id: 5, name: 'Cosme', date: '1 month ago', rating: 4, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop' },
];

// User preferences
const PREFERENCES = {
  cuisines: ['Japanese', 'Italian', 'Mexican', 'French'],
  dietary: ['No shellfish', 'Prefers outdoor seating'],
  priceRange: '$$-$$$',
  atmosphere: ['Quiet', 'Romantic', 'Modern'],
};

// User's food photos
const MY_PHOTOS = [
  'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558030006-450675393462?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&h=300&fit=crop',
];

export default function ProfilePage() {
  return (
    <div className="h-full p-8 overflow-y-auto bg-white">
      <div className="relative max-w-6xl mx-auto space-y-8">
        {/* Profile Header - Centered */}
        <div className="text-center">
          <img
            src={USER.avatar}
            alt={USER.name}
            className="w-28 h-28 rounded-3xl object-cover shadow-medium mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold mb-2">{USER.name}</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-3">{USER.username}</p>
          <p className="text-sm max-w-md mx-auto mb-4">{USER.bio}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              className="px-5 py-2.5 rounded-full text-sm font-medium"
              style={{
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                border: '0.25px solid rgba(0, 0, 0, 0.08)',
                boxShadow: 'inset 0 0 30px -8px rgba(255, 255, 255, 0.9), 0 4px 12px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Share2 className="w-4 h-4 inline mr-1.5" />
              Share
            </button>
            <button
              className="px-5 py-2.5 rounded-full text-sm font-medium"
              style={{
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                border: '0.25px solid rgba(0, 0, 0, 0.08)',
                boxShadow: 'inset 0 0 30px -8px rgba(255, 255, 255, 0.9), 0 4px 12px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Settings className="w-4 h-4 inline mr-1.5" />
              Edit
            </button>
          </div>
        </div>

        {/* Stats - Inline */}
        <div className="grid grid-cols-4 gap-8 max-w-3xl mx-auto">
          {[
            { label: 'Visits', value: USER.stats.totalVisits },
            { label: 'Restaurants', value: USER.stats.totalRestaurants },
            { label: 'Friends', value: USER.stats.friendCount },
            { label: 'Favorites', value: USER.stats.favoriteCount },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Content - Three Columns */}
        <div className="grid grid-cols-3 gap-6">
          {/* Restaurant History */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">Recent Visits</h2>
            <div className="space-y-3">
              {VISIT_HISTORY.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center gap-3 py-2 hover:translate-x-1 transition-transform cursor-pointer"
                >
                  <img
                    src={visit.image}
                    alt={visit.name}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{visit.name}</div>
                    <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <Clock className="w-3 h-3" />
                      {visit.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold">{visit.rating}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="text-xs text-[hsl(var(--primary))] font-medium hover:underline">
              View all visits →
            </button>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">Preferences</h2>
            
            <div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                Favorite Cuisines
              </div>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.cuisines.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(12px)',
                      border: '0.25px solid rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {cuisine}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                Dietary Notes
              </div>
              <div className="space-y-1.5">
                {PREFERENCES.dietary.map((note) => (
                  <div key={note} className="text-sm flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[hsl(var(--primary))]" />
                    {note}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                Price Range
              </div>
              <div className="text-sm font-semibold">{PREFERENCES.priceRange}</div>
            </div>

            <div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                Atmosphere
              </div>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.atmosphere.map((vibe) => (
                  <span
                    key={vibe}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(12px)',
                      border: '0.25px solid rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* My Photos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">My Photos</h2>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{MY_PHOTOS.length} photos</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MY_PHOTOS.slice(0, 9).map((photo, index) => (
                <div
                  key={index}
                  className="relative rounded-xl overflow-hidden aspect-square cursor-pointer group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(12px)',
                    border: '0.25px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                </div>
              ))}
            </div>
            <button className="text-xs text-[hsl(var(--primary))] font-medium hover:underline">
              View all photos →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
