'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Utensils } from 'lucide-react';
import { DemoSocialGraph } from '@/components/DemoSocialGraph';
import Image from 'next/image';

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
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', user.id)
          .single();

        if (profileData?.onboarded) {
          router.push('/overview');
          return;
        }

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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarded: true,
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      router.push('/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-100">
        <DemoSocialGraph className="w-full h-full" />
      </div>
        
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-60">
        <DemoSocialGraph className="w-full h-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="glass-card rounded-3xl p-8 shadow-strong relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl" />
          
          <div className="relative space-y-6">

            <div className="text-center space-y-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center -mb-2"
              >
                <img 
                  src="/assets/yummylogo.png"
                  alt="Yummy Logo" 
                  className="h-40 w-auto object-contain"
                />
              </motion.div>
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

        {!isAuthenticated ? (
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
