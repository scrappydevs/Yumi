'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Phone, User, Mail, Loader2, Check } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return;
        }

        setEmail(user.email || '');

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setDisplayName(profileData.display_name || '');
          setUsername(profileData.username || '');
          setPhone(profileData.phone || '');
          setBio(profileData.bio || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Format phone if provided
      let formattedPhone = phone.trim();
      if (formattedPhone && !formattedPhone.startsWith('+')) {
        formattedPhone = `+1${formattedPhone.replace(/\D/g, '')}`;
      }

      // Validate E.164 if phone provided
      if (formattedPhone && !formattedPhone.match(/^\+[1-9]\d{1,14}$/)) {
        throw new Error('Invalid phone number. Use format: +1234567890');
      }

      const updateData: Record<string, unknown> = {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
      };

      if (formattedPhone) {
        updateData.phone = formattedPhone;
        updateData.onboarded = true;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40 p-8 relative">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          >
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">Settings saved successfully!</p>
          </motion.div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10"
                  placeholder="Your name"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Username (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <Input
                type="text"
                value={username}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Username cannot be changed
              </p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="pl-10 bg-gray-50 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Email is managed by Google
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  placeholder="+1234567890"
                  required
                  disabled={saving}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Required for sending/receiving reservation invitations
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio (optional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg resize-none"
                rows={3}
                placeholder="Tell us about yourself..."
                disabled={saving}
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full gradient-purple-blue text-white h-12 text-base font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </Card>
      </div>

      {/* Logout Button - Bottom Left */}
      <div className="fixed bottom-8 left-8">
        <Button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/';
          }}
          variant="destructive"
          className="shadow-lg"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
