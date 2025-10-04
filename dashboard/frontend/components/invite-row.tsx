'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, MessageCircle, Share2, Check } from 'lucide-react'
import { buildMessagesHref, copyToClipboard, shareOrCopy, formatPhoneForDisplay } from '@/lib/imessage'
import { motion, AnimatePresence } from 'framer-motion'

interface InviteRowProps {
  phoneE164: string
  text: string
  href?: string // Optional pre-built href
}

export function InviteRow({ phoneE164, text, href }: InviteRowProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  
  const messagesHref = href || buildMessagesHref(phoneE164, text)
  
  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleShare = async () => {
    const result = await shareOrCopy(text)
    if (result === 'shared') {
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } else if (result === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  return (
    <div className="glass-layer-1 rounded-2xl p-4 space-y-3 shadow-soft relative overflow-hidden">
      {/* Specular highlight */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-2xl" />
      
      <div className="relative z-10">
        {/* Phone number */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-black">
            {formatPhoneForDisplay(phoneE164)}
          </span>
          
          <AnimatePresence>
            {(copied || shared) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 text-green-600 text-xs font-medium"
              >
                <Check className="w-3 h-3" />
                {shared ? 'Shared!' : 'Copied!'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Message preview */}
        <div 
          className="bg-white/40 rounded-xl p-3 mb-3 text-sm text-gray-700 cursor-pointer hover:bg-white/60 transition-colors border border-gray-100"
          onClick={handleCopy}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleCopy()
            }
          }}
          aria-label={`Copy message for ${formatPhoneForDisplay(phoneE164)}`}
        >
          {text}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 gradient-purple-blue text-white shadow-md hover:shadow-lg transition-shadow h-10"
          >
            <a href={messagesHref} target="_self">
              <MessageCircle className="w-4 h-4 mr-2" />
              Open iMessage
            </a>
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="glass-layer-1 border-0 shadow-soft hover:shadow-md text-black"
            size="sm"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleCopy}
            variant="outline"
            className="glass-layer-1 border-0 shadow-soft hover:shadow-md text-black"
            size="sm"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

