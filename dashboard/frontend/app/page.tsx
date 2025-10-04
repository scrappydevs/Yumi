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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      router.push('/overview');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % restaurantPhotos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-200/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-2xl gradient-purple-blue flex items-center justify-center shadow-lg">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Eats
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button
                onClick={handleGoogleSignIn}
                className="btn-glass gpu text-slate-800 hover:text-slate-900 font-medium"
              >
                Sign In
              </Button>
            </motion.div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-8 py-4 md:py-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 panel-glass px-4 py-2 rounded-full"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Social Dining, Reimagined
                  </span>
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight tracking-tight">
                  Discover restaurants{' '}
                  <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent">
                    with friends
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl">
                  Ask natural questions, see where your friends love to eat, and book tables together. 
                  Your social network for dining out.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleGoogleSignIn}
                  size="lg"
                  className="gradient-purple-blue text-white rounded-2xl px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all gpu group"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="btn-glass rounded-2xl px-8 py-6 text-base font-medium border-slate-300"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  See How It Works
                </Button>
              </div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-6 pt-4"
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 ring-4 ring-white"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-slate-900">Join the community</div>
                  <div className="text-slate-600">Discover your next favorite spot</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Interactive Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              {/* Main Display Card */}
              <div className="relative panel-glass p-8 rounded-3xl shadow-2xl gpu">
                <span className="glass-highlight" />
                
                {/* Photo Carousel */}
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-6">
                  {restaurantPhotos.map((photo, index) => (
                    <motion.img
                      key={photo}
                      src={photo}
                      alt="Restaurant"
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: index === currentPhotoIndex ? 1 : 0,
                        scale: index === currentPhotoIndex ? 1 : 1.1,
                      }}
                      transition={{ duration: 0.7 }}
                    />
                  ))}
                  
                  {/* Overlay Badge */}
                  <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-full shadow-md">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-xs font-semibold text-slate-800">
                        12 friends love this
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prompt Example */}
                <div className="glass-backdrop-xl bg-white/70 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full gradient-purple-blue flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 font-medium mb-2">
                        "Where should we eat tonight?"
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MapPin className="w-3 h-3" />
                          <span>Found 3 spots your friends recommend nearby</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                            Italian
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                            Quiet
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-20 h-20 gradient-purple-blue rounded-2xl shadow-xl flex items-center justify-center"
              >
                <Heart className="w-8 h-8 text-white" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl flex items-center justify-center"
              >
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A complete social dining experience, from discovery to reservations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="panel-glass p-6 rounded-2xl group hover:shadow-xl transition-all gpu cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl gradient-purple-blue flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-8 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative panel-glass p-12 rounded-3xl text-center overflow-hidden"
          >
            <span className="glass-highlight" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Ready to discover?
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                Join your friends and explore the best restaurants together
              </p>
              
              <Button
                onClick={handleGoogleSignIn}
                size="lg"
                className="gradient-purple-blue text-white rounded-2xl px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all gpu group"
              >
                Sign in with Google
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Decorative gradient orbs */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-400/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-400/30 rounded-full blur-3xl" />
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200/60 py-8">
          <div className="max-w-7xl mx-auto px-8 text-center text-sm text-slate-600">
            <p>© 2025 Eats. Your social network for dining out.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
