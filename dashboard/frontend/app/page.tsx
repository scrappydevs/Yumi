'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Utensils } from 'lucide-react';
import { LiquidGlassBlob } from '@/components/liquid-glass-blob';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    async function checkAuthAndOnboarding() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Not logged in, show sign in page
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Check if user has completed onboarding
        const { data: profileData } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', user.id)
          .single();

        if (profileData?.onboarded) {
          // Already onboarded, redirect to app
          router.push('/overview');
          return;
        }

        // User is authenticated but not onboarded
        setIsOnboarded(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndOnboarding();
  }, [router, supabase]);

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing in:', error.message);
      setError(error.message);
      setSubmitting(false);
    }
  };

  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Update profile - mark as onboarded
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarded: true,
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to app
      router.push('/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        {/* Bouncing purple highlights */}
        <motion.div
          className="absolute w-6 h-6 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50"
          animate={{
            x: [0, 60, -40, 80, -60, 0],
            y: [0, -80, 60, -40, 80, 0],
            scale: [1, 1.5, 0.8, 1.3, 0.9, 1],
            opacity: [0.7, 1, 0.6, 0.9, 0.7, 0.7],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-5 h-5 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"
          animate={{
            x: [0, -70, 50, -30, 70, 0],
            y: [0, 70, -50, 90, -70, 0],
            scale: [1, 1.2, 0.9, 1.4, 0.8, 1],
            opacity: [0.6, 0.9, 0.7, 1, 0.6, 0.6],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
        <motion.div
          className="absolute w-7 h-7 rounded-full bg-purple-300 shadow-lg shadow-purple-300/50"
          animate={{
            x: [0, 50, -60, 40, -50, 0],
            y: [0, -60, -40, 70, -50, 0],
            scale: [1, 0.9, 1.4, 0.8, 1.2, 1],
            opacity: [0.5, 0.8, 0.6, 0.9, 0.5, 0.5],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6,
          }}
        />
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-purple-600 shadow-lg shadow-purple-600/50"
          animate={{
            x: [0, -50, 70, -80, 60, 0],
            y: [0, 80, -70, 50, -60, 0],
            scale: [1, 1.3, 0.7, 1.5, 0.9, 1],
            opacity: [0.8, 1, 0.7, 0.9, 0.8, 0.8],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.9,
          }}
        />
        
        {/* Central spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-purple-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Animated background blobs */}
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

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Liquid Glass Card */}
        <div className="glass-card rounded-3xl p-8 shadow-strong relative overflow-hidden">
          {/* Specular highlight */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl" />
          
          <div className="relative space-y-8">

            {/* Header */}
            <div className="text-center space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold text-[hsl(var(--foreground))]"
              >
                Yummy
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-base text-[hsl(var(--muted-foreground))]"
              >
                Agentic Food Social Network
              </motion.p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50/80 border border-red-200 rounded-xl"
              >
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {!isAuthenticated ? (
          // Sign In Button for non-authenticated users
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="glass-btn-inline w-full h-14 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in with Google</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </motion.button>
        ) : (
          // Get Started Button for authenticated but not onboarded users
          <form onSubmit={handleGetStarted} className="mt-6">
            <motion.button
              type="submit"
              disabled={submitting}
              className="glass-btn-inline w-full h-14 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
