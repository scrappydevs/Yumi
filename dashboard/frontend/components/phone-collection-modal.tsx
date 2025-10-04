'use client'

import { useState } from 'react'
import { X, Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface PhoneCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (phone: string) => void
}

export function PhoneCollectionModal({ isOpen, onClose, onSuccess }: PhoneCollectionModalProps) {
  const supabase = createClient()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Validate phone number (basic)
      const cleanPhone = phoneNumber.trim()
      if (!cleanPhone) {
        throw new Error('Phone number is required')
      }

      // Format to E.164 if not already
      let formattedPhone = cleanPhone
      if (!cleanPhone.startsWith('+')) {
        // Assume US number
        formattedPhone = `+1${cleanPhone.replace(/\D/g, '')}`
      }

      // Validate E.164 format
      if (!formattedPhone.match(/^\+[1-9]\d{1,14}$/)) {
        throw new Error('Invalid phone number. Use format: +1234567890')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: formattedPhone,
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Success - call the callback
      onSuccess(formattedPhone)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save phone number')
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-white rounded-3xl p-6 shadow-2xl m-4 border border-gray-100">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Phone Number Required
                    </h2>
                    <p className="text-sm text-gray-600">
                      We need your phone number to send reservation invitations
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    disabled={submitting}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50/80 border border-red-200 rounded-xl mb-4"
                  >
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}

                {/* Phone Input Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </Label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flex-1 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 text-gray-900 placeholder:text-gray-400"
                        required
                        disabled={submitting}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter your phone number in international format (e.g., +1234567890)
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !phoneNumber.trim()}
                      className="flex-1 gradient-purple-blue text-white"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Continue'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

