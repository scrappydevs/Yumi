'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Phone, Loader2, ArrowRight } from 'lucide-react';
import { LiquidGlassBlob } from '@/components/liquid-glass-blob';

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ display_name: string; username: string } | null>(null);
  
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Not logged in, redirect to home
          router.push('/');
          return;
        }

        // Check if user has completed onboarding
        const { data: profileData } = await supabase
          .from('profiles')
          .select('onboarded, display_name, username, phone')
          .eq('id', user.id)
          .single();

        if (profileData?.onboarded && profileData?.phone) {
          // Already onboarded, redirect to app
          router.push('/overview');
          return;
        }

        setProfile({
          display_name: profileData?.display_name || '',
          username: profileData?.username || '',
        });
        
        // Pre-fill phone if exists
        if (profileData?.phone) {
          setPhoneNumber(profileData.phone);
        }
      } catch (err) {
        console.error('Error checking onboarding:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    checkOnboarding();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate phone number (basic)
      const cleanPhone = phoneNumber.trim();
      if (!cleanPhone) {
        throw new Error('Phone number is required');
      }

      // Format to E.164 if not already
      let formattedPhone = cleanPhone;
      if (!cleanPhone.startsWith('+')) {
        // Assume US number
        formattedPhone = `+1${cleanPhone.replace(/\D/g, '')}`;
      }

      // Validate E.164 format
      if (!formattedPhone.match(/^\+[1-9]\d{1,14}$/)) {
        throw new Error('Invalid phone number. Use format: +1234567890');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: formattedPhone,
          onboarded: true,
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to app
      router.push('/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
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
          
          <div className="relative space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-[hsl(var(--muted-foreground))]"
              >
                Enter your phone to send reservations
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

            {/* Phone Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="glass-layer-1 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />
                <div className="relative flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                    required
                    disabled={submitting}
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={submitting || !phoneNumber.trim()}
                className="w-full gradient-purple-blue text-white rounded-2xl h-14 text-base font-semibold shadow-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Setting up...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            {/* Helper text */}
            <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
              Used for reservation invitations only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

