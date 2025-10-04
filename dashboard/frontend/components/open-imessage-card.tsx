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
    <div className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-3">📱</div>
        <h2 className="text-2xl font-bold text-black mb-2">Send Invitation</h2>
        <p className="text-sm text-gray-600">
          Your reservation has been created
        </p>
      </div>
      
      {/* Phone Number Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
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
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between group"
          data-test="copy-number"
          aria-label={`Copy phone number ${toNumber}`}
        >
          <span className="font-mono text-sm text-gray-800">{toNumber}</span>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {copiedNumber && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs text-green-600 font-medium"
                >
                  Copied!
                </motion.span>
              )}
            </AnimatePresence>
            {copiedNumber ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            )}
          </div>
        </div>
      </div>
      
      {/* Message Body Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
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
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors relative group"
          data-test="copy-body"
          aria-label="Copy message"
        >
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {presetBody}
          </p>
          <div className="absolute top-3 right-3">
            <AnimatePresence>
              {copiedBody && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-1 right-0 text-xs text-green-600 font-medium bg-white px-2 py-1 rounded-md shadow-sm"
                >
                  Copied!
                </motion.span>
              )}
            </AnimatePresence>
            {copiedBody ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            )}
          </div>
        </div>
      </div>
      
      {/* CTA Button */}
      <a
        href={href}
        rel="noopener"
        target="_self"
        className="block w-full gradient-purple-blue text-white rounded-2xl h-16 flex items-center justify-center gap-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
        data-test="open-imessage"
        aria-label={ctaText}
      >
        <span className="text-2xl">💬</span>
        <span>{ctaText}</span>
      </a>
      
      {/* Platform Note */}
      {!isApple && (
        <p className="text-xs text-gray-500 text-center px-4">
          💡 If this doesn't open Messages, copy the text and number above and send manually.
        </p>
      )}
      
      {isApple && (
        <p className="text-xs text-gray-500 text-center px-4">
          💡 If the message isn't pre-filled, copy it from above and paste into Messages.
        </p>
      )}
    </div>
  )
}

