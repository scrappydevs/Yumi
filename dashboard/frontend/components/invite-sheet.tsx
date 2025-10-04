'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InviteRow } from './invite-row'
import { Copy, MessageCircle, Check } from 'lucide-react'
import { copyToClipboard, buildMessagesHref } from '@/lib/imessage'
import { motion, AnimatePresence } from 'framer-motion'

interface Invite {
  inviteId: string
  phoneE164: string
  text: string
  url: string
}

interface InviteSheetProps {
  invites: Invite[]
  restaurantName: string
}

export function InviteSheet({ invites, restaurantName }: InviteSheetProps) {
  const [copiedAll, setCopiedAll] = useState(false)
  
  const handleCopyAll = async () => {
    const allTexts = invites.map(inv => inv.text).join('\n\n')
    const success = await copyToClipboard(allTexts)
    if (success) {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    }
  }
  
  const handleOpenAll = () => {
    // Try to open all iMessage links sequentially
    // Note: May be blocked by popup blocker
    invites.forEach((invite, index) => {
      setTimeout(() => {
        const href = buildMessagesHref(invite.phoneE164, invite.text)
        window.open(href, '_self')
      }, index * 500) // 500ms delay between each
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2">📱</div>
        <h3 className="text-2xl font-bold text-black">Send Invitations</h3>
        <p className="text-gray-700 text-sm max-w-md mx-auto">
          Tap "Open iMessage" for each friend to send your reservation invite for <span className="font-semibold">{restaurantName}</span>
        </p>
      </div>
      
      {/* Bulk Actions */}
      {invites.length > 1 && (
        <div className="flex gap-3">
          <Button
            onClick={handleOpenAll}
            variant="outline"
            className="flex-1 glass-layer-1 border-0 shadow-soft hover:shadow-md text-black h-12"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Open All ({invites.length})
          </Button>
          
          <Button
            onClick={handleCopyAll}
            variant="outline"
            className="flex-1 glass-layer-1 border-0 shadow-soft hover:shadow-md text-black h-12 relative"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy All
            
            <AnimatePresence>
              {copiedAll && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-lg"
                >
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      )}
      
      {/* Individual invite rows */}
      <div className="space-y-3">
        {invites.map((invite, index) => (
          <motion.div
            key={invite.inviteId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <InviteRow
              phoneE164={invite.phoneE164}
              text={invite.text}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Help text */}
      <div className="glass-layer-1 rounded-xl p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs text-gray-600 text-center">
            💡 <span className="font-medium">Tip:</span> If iMessage doesn't open automatically, copy the text and paste it into Messages manually.
          </p>
        </div>
      </div>
    </div>
  )
}

