'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Users, 
  MapPin, 
  MessageCircle, 
  Calendar,
  TrendingUp,
  Heart,
  Utensils,
  ArrowRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { LiquidGlassBlob } from '@/components/liquid-glass-blob';
import { MetallicSphereComponent } from '@/components/metallic-sphere';

const features = [
  {
    icon: Sparkles,
    title: 'Natural Language',
    description: 'Ask "Where does Alex like to eat?" and discover instantly',
  },
  {
    icon: Users,
    title: 'Social Dining',
    description: 'See where your friends love to eat and share experiences',
  },
  {
    icon: MapPin,
    title: 'Smart Discovery',
    description: 'Google Maps + Reviews enhanced with friend opinions',
  },
  {
    icon: MessageCircle,
    title: 'Coordinate Plans',
    description: 'Message friends and book tables together',
  },
  {
    icon: Calendar,
    title: 'Easy Reservations',
    description: 'One-tap reservations synced to your calendar',
  },
  {
    icon: TrendingUp,
    title: 'Eats Wrapped',
    description: 'Your year in dining with shareable stats',
  },
];

const restaurantPhotos = [
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=400&fit=crop',
];

export default function Home() {
  const supabase = createClient();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/overview');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing in:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Utensils className="w-8 h-8 text-purple-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Three.js Animated Blobs - Only render on client */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none">
          <LiquidGlassBlob 
            isAnimating={true}
            className="absolute top-20 left-20 w-[300px] h-[300px]"
          />
          <LiquidGlassBlob 
            isAnimating={true}
            className="absolute bottom-20 right-20 w-[400px] h-[400px]"
          />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg px-4"
      >
        {/* Liquid Glass Card */}
        <div className="glass-card rounded-3xl p-12 shadow-strong relative overflow-hidden">
          {/* Specular highlight */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl" />
          
          <div className="relative space-y-8 text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 rounded-2xl gradient-purple-blue flex items-center justify-center mx-auto shadow-lg"
            >
              <Utensils className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #9B87F5 0%, #7B61FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Yummy
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-[hsl(var(--muted-foreground))]"
              >
                Discover restaurants with friends
              </motion.p>
            </div>

            {/* Features Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {[
                { icon: Users, text: 'Social' },
                { icon: MapPin, text: 'Discovery' },
                { icon: Calendar, text: 'Reservations' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="glass-layer-1 px-4 py-2 rounded-full flex items-center gap-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none" />
                  <item.icon className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">{item.text}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              onClick={handleGoogleSignIn}
              className="w-full gradient-purple-blue text-white rounded-2xl h-16 text-lg font-semibold shadow-lg relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
              <div className="relative z-10 flex items-center justify-center gap-2">
                <span>Sign in with Google</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>

            {/* Footer text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-xs text-[hsl(var(--muted-foreground))]"
            >
              Your social network for dining out
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
