'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send,
  Mic,
  Image as ImageIcon,
  Search,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Mock food memory photos (expanded)
const MEMORY_PHOTOS = [
  { id: 1, src: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=400&h=400&fit=crop', location: 'Tokyo', date: '2024-03', friend: 'Aarush' },
  { id: 2, src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=400&fit=crop', location: 'Paris', date: '2024-02', friend: 'Sarah' },
  { id: 3, src: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop', location: 'NYC', date: '2024-01', friend: 'Marcus' },
  { id: 4, src: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop', location: 'Tokyo', date: '2024-03', friend: 'Aarush' },
  { id: 5, src: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop', location: 'NYC', date: '2024-02', friend: 'Emily' },
  { id: 6, src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop', location: 'Mexico City', date: '2024-01', friend: 'Sarah' },
  { id: 7, src: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop', location: 'Brooklyn', date: '2024-03', friend: 'Marcus' },
  { id: 8, src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop', location: 'Paris', date: '2024-02', friend: 'Aarush' },
  { id: 9, src: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=400&fit=crop', location: 'NYC', date: '2024-01', friend: 'Emily' },
  { id: 10, src: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&h=400&fit=crop', location: 'Tokyo', date: '2024-03', friend: 'Sarah' },
  { id: 11, src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop', location: 'Rome', date: '2024-02', friend: 'Marcus' },
  { id: 12, src: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=400&fit=crop', location: 'Brooklyn', date: '2024-01', friend: 'Aarush' },
  { id: 13, src: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=400&fit=crop', location: 'Tokyo', date: '2024-03', friend: 'Emily' },
  { id: 14, src: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', location: 'Paris', date: '2024-02', friend: 'Sarah' },
  { id: 15, src: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=400&fit=crop', location: 'NYC', date: '2024-01', friend: 'Marcus' },
  { id: 16, src: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop', location: 'Brooklyn', date: '2024-03', friend: 'Aarush' },
  { id: 17, src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop', location: 'Paris', date: '2024-02', friend: 'Emily' },
  { id: 18, src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', location: 'Tokyo', date: '2024-01', friend: 'Sarah' },
];

export default function MemoriesPage() {
  const [prompt, setPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [mounted, setMounted] = useState(false);

  const photosPerPage = 12;
  const totalPages = Math.ceil(MEMORY_PHOTOS.length / photosPerPage);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    console.log('Generating memory:', prompt);
  };

  const filteredPhotos = MEMORY_PHOTOS.filter(photo => {
    const matchesSearch = photo.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         photo.friend.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !selectedFilter || 
                         photo.friend === selectedFilter || 
                         photo.location === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const currentPhotos = filteredPhotos.slice(page * photosPerPage, (page + 1) * photosPerPage);

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Bar - Search & Filters */}
      <div className="border-b border-[hsl(var(--border))] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories by location or friend..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm
                          focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(20px)',
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  boxShadow: 'inset 0 0 25px -8px rgba(255, 255, 255, 0.9)',
                }}
              />
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(12px)',
                  border: '0.25px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(12px)',
                  border: '0.25px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Filter:</span>
            <button
              onClick={() => setSelectedFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !selectedFilter ? 'gradient-purple-blue text-white' : ''
              }`}
              style={!selectedFilter ? {} : {
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(12px)',
                border: '0.25px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              All
            </button>
            {['Aarush', 'Sarah', 'Marcus', 'Emily'].map((friend) => (
              <button
                key={friend}
                onClick={() => setSelectedFilter(friend)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedFilter === friend ? 'gradient-purple-blue text-white' : ''
                }`}
                style={selectedFilter === friend ? {} : {
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(12px)',
                  border: '0.25px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <Users className="w-3 h-3 inline mr-1" />
                {friend}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Photo Grid - Sliding */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              className="grid grid-cols-6 gap-3 h-full auto-rows-fr"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {currentPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  className="relative rounded-2xl overflow-hidden shadow-medium cursor-pointer group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '0.25px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: 'inset 0 0 30px -8px rgba(255, 255, 255, 0.9), 0 6px 20px rgba(0, 0, 0, 0.08)',
                  }}
                  whileHover={{
                    scale: 1.05,
                    zIndex: 10,
                    boxShadow: 'inset 0 0 35px -8px rgba(255, 255, 255, 0.95), 0 12px 32px rgba(0, 0, 0, 0.12)',
                  }}
                >
                  {/* Specular */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none rounded-t-2xl z-10"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
                    }}
                  />
                  <img
                    src={photo.src}
                    alt="Memory"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Info overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                    <div className="text-white text-[10px] font-semibold">{photo.location}</div>
                    <div className="text-white/80 text-[9px]">with {photo.friend}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Chat Panel */}
      <div 
        className="p-6"
        style={{
          borderTop: '0.25px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div
            className="glass-layer-1 rounded-full h-14 px-5 shadow-strong relative overflow-hidden flex items-center gap-3"
          >
            {/* Specular highlight */}
            <div 
              className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-full"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%)',
              }}
            />
            
            <form onSubmit={handleGenerate} className="flex-1 flex items-center gap-3 relative">
              <ImageIcon className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Create a video about my Paris food trip with Aarush..."
                className="flex-1 bg-transparent border-0 outline-none focus:outline-none text-sm placeholder:text-[hsl(var(--muted-foreground))]"
              />
              
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(12px)',
                    border: '0.25px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: 'inset 0 0 25px -8px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.05)',
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: 'inset 0 0 30px -8px rgba(255, 255, 255, 0.95), 0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-xl" />
                  <Mic className="w-4 h-4 text-[hsl(var(--foreground))]" />
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="w-9 h-9 rounded-xl gradient-purple-blue flex items-center justify-center relative overflow-hidden disabled:opacity-40"
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
                  <Send className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </form>
          </div>
          
          {/* Helper text */}
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mt-3">
            {filteredPhotos.length} memories • Use natural language to create your story
          </p>
        </div>
      </div>
    </div>
  );
}
