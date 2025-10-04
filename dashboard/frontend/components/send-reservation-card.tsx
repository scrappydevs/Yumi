'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReservationModal } from './reservation-modal';

type SendReservationCardProps = {
  friendId: string;
  friendName: string;
  friendPhone?: string;
  className?: string;
};

export function SendReservationCard({
  friendId,
  friendName,
  friendPhone,
  className = '',
}: SendReservationCardProps) {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSendReservation = () => {
    setModalOpen(true);
  };

  return (
    <Card className={`glass-card rounded-3xl p-6 shadow-strong relative overflow-hidden ${className}`}>
      {/* Specular highlight */}
      <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">Send Reservation</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Invite {friendName} to dine with you</p>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <div className="glass-layer-1 rounded-xl px-4 py-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Choose restaurant & time</p>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">Next step</p>
              </div>
            </div>
          </div>

          <div className="glass-layer-1 rounded-xl px-4 py-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Inviting</p>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{friendName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={handleSendReservation}
          disabled={loading}
          className="block w-full gradient-purple-blue text-white rounded-2xl h-14 text-base font-semibold shadow-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: loading ? 1 : 1.02, boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)' }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-center gap-2 h-full">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                <span>Create Reservation</span>
              </>
            )}
          </div>
        </motion.button>

        {/* Info note */}
        <p className="text-xs text-center text-[hsl(var(--muted-foreground))] px-2">
          {friendName} will receive an SMS invitation to confirm
        </p>
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="create"
        showIntro={true}
        prefillInvitee={{
          id: friendId,
          name: friendName,
          phone: friendPhone
        }}
      />
    </Card>
  );
}

