'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type OpenIMessageCardProps = {
  toNumber: string            // e.g. "+17149410453"
  presetBody: string          // e.g. "🍽️ Join me at Nobu..."
  ctaText?: string            // default: "Open iMessage"
  className?: string
}

/**
 * Check if platform is likely Apple (iOS/macOS)
 */
function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const platform = navigator.platform || ''
  return /\b(iPhone|iPad|iPod|Macintosh|Mac OS X|MacIntel)\b/.test(ua + platform)
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      return false
    }
  }
}

export function OpenIMessageCard({
  toNumber,
  presetBody,
  ctaText = "Open iMessage",
  className = ''
}: OpenIMessageCardProps) {
  const [copiedNumber, setCopiedNumber] = useState(false)
  const [copiedBody, setCopiedBody] = useState(false)
  
  const isApple = isApplePlatform()
  
  // Build the deep link
  const encoded = encodeURIComponent(presetBody)
  const href = `sms:${toNumber}?&body=${encoded}`
  
  const handleCopyNumber = async () => {
    const success = await copyToClipboard(toNumber)
    if (success) {
      setCopiedNumber(true)
      setTimeout(() => setCopiedNumber(false), 1500)
    }
  }
  
  const handleCopyBody = async () => {
    const success = await copyToClipboard(presetBody)
    if (success) {
      setCopiedBody(true)
      setTimeout(() => setCopiedBody(false), 1500)
    }
  }
  
  return (
    <div className={`glass-card rounded-3xl p-8 shadow-strong relative overflow-hidden ${className}`}>
      {/* Specular highlight */}
      <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl" />
      
      <div className="relative space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full glass-layer-1 shadow-soft mb-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-full pointer-events-none" />
            <Check className="w-6 h-6 text-green-600 relative z-10" />
          </div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Reservation Created</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Send invitation to confirm
          </p>
        </div>
        
        {/* Phone Number Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
            Send to
          </label>
          <div
            role="button"
            tabIndex={0}
            onClick={handleCopyNumber}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCopyNumber()
              }
            }}
            className="glass-layer-1 rounded-2xl px-4 py-3.5 cursor-pointer hover:shadow-soft transition-all flex items-center justify-between group relative overflow-hidden"
            data-test="copy-number"
            aria-label={`Copy phone number ${toNumber}`}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />
            <span className="font-mono text-sm text-[hsl(var(--foreground))] relative z-10">{toNumber}</span>
            <div className="flex items-center gap-2 relative z-10">
              <AnimatePresence>
                {copiedNumber && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-xs text-green-600 font-medium"
                  >
                    Copied
                  </motion.span>
                )}
              </AnimatePresence>
              {copiedNumber ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]" />
              )}
            </div>
          </div>
        </div>
        
        {/* Message Body Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
            Message
          </label>
          <div
            role="button"
            tabIndex={0}
            onClick={handleCopyBody}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCopyBody()
              }
            }}
            className="glass-layer-1 rounded-2xl px-4 py-3.5 cursor-pointer hover:shadow-soft transition-all relative group overflow-hidden"
            data-test="copy-body"
            aria-label="Copy message"
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />
            <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere pr-8 relative z-10">
              {presetBody}
            </p>
            <div className="absolute top-3 right-3 z-10">
              <AnimatePresence>
                {copiedBody && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-1 right-0 text-xs text-green-600 font-medium bg-white px-2 py-1 rounded-lg shadow-soft"
                  >
                    Copied
                  </motion.span>
                )}
              </AnimatePresence>
              {copiedBody ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]" />
              )}
            </div>
          </div>
        </div>
        
        {/* CTA Button */}
        <motion.a
          href={href}
          rel="noopener"
          target="_self"
          className="glass-btn-inline block w-full h-14 text-base font-semibold relative"
          data-test="open-imessage"
          aria-label={ctaText}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {ctaText}
        </motion.a>
        
        {/* Platform Note */}
        <p className="text-xs text-[hsl(var(--muted-foreground))] text-center px-4">
          {!isApple
            ? "If this doesn't open Messages, copy the text and number above and send manually."
            : "If the message isn't pre-filled, copy it from above and paste into Messages."}
        </p>
      </div>
    </div>
  )
}

