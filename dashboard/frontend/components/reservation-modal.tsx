'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Calendar as CalendarIcon, Users, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Phone, ExternalLink, Star, DollarSign, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { apiRequest, API_CONFIG } from '@/lib/api-config'
import { format, parseISO } from 'date-fns'
import { OpenIMessageCard } from './open-imessage-card'
import { PhoneCollectionModal } from './phone-collection-modal'

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'view'
  reservationId?: string
  prefillInvitee?: {
    id?: string
    name?: string
    phone?: string
  }
  prefillRestaurant?: {
    name?: string
    address?: string
    place_id?: string
  }
  showIntro?: boolean // Show intro step if coming from friend profile
}

interface Restaurant {
  id: string
  name: string
  formatted_address?: string
}

interface Profile {
  id: string
  username: string
  display_name: string
}

interface Invitee {
  phone: string
  profileId?: string
}

interface RestaurantImage {
  id: string
  url: string
  description?: string | null
  dish?: string | null
}

interface RestaurantDetails {
  name: string
  address: string | null
  phone: string | null
  website: string | null
  google_maps_url: string | null
  rating: number | null
  user_ratings_total: number | null
  price_level: number | null
  description: string | null
  images: RestaurantImage[]
}

interface ReservationData {
  id: string
  organizer_id: string
  restaurant_id: string
  restaurant_name: string
  restaurant_address: string | null
  restaurant: RestaurantDetails
  starts_at: string
  party_size: number
  status: string
  invites: Array<{
    id: string
    inviteePhoneE164: string
    rsvpStatus: string
    respondedAt: string | null
    inviteeName: string | null
  }>
}

export function ReservationModal({ isOpen, onClose, mode: initialMode, reservationId, prefillInvitee, prefillRestaurant, showIntro = false }: ReservationModalProps) {
  const supabase = createClient()
  
  const [mode, setMode] = useState<'create' | 'view'>(initialMode)
  const [step, setStep] = useState<'intro' | 'form'>(showIntro ? 'intro' : 'form')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState<string | null>(null)
  
  // Create mode state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [partySize, setPartySize] = useState(1)
  const [invitees, setInvitees] = useState<Invitee[]>([])
  const [success, setSuccess] = useState(false)
  const [inviteMessage, setInviteMessage] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Phone collection modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  
  // View mode state
  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [inviteeAvatarUrl, setInviteeAvatarUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isOpen) {
      console.log('🔓 Modal opened:', { mode: initialMode, reservationId, currentUser })
      
      // Reset mode to match initialMode
      setMode(initialMode)
      setShowDeleteConfirm(false) // Reset confirmation dialog
      
      // Reset step when modal opens
      setStep(showIntro ? 'intro' : 'form')
      
      // Reset success state
      setSuccess(false)
      
      // Clear previous reservation data
      setReservation(null)
      
      if (initialMode === 'create') {
        loadCreateData()
        
        // Load invitee profile picture if available
        if (prefillInvitee?.id) {
          loadInviteeAvatar(prefillInvitee.id)
        }
      } else if (initialMode === 'view' && reservationId) {
        loadReservation()
      }
    }
  }, [isOpen, initialMode, reservationId, showIntro, prefillInvitee, prefillRestaurant])

  useEffect(() => {
    if (prefillInvitee?.phone) {
      setInvitees([{
        phone: prefillInvitee.phone,
        profileId: prefillInvitee.id
      }])
    }
  }, [prefillInvitee])

  const loadCreateData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser(user.id)
      
      // Check if user has a phone number
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single()
      
      setUserPhone(profile?.phone || null)
    }

    console.log('🍽️ Loading create data with prefillRestaurant:', prefillRestaurant)

    // Load restaurants
    const { data: restaurantsData } = await supabase
      .from('restaurants')
      .select('id, name, formatted_address')
      .limit(100)

    if (restaurantsData) {
      setRestaurants(restaurantsData)
      
      // If we have prefilled restaurant data, try to find or create it
      if (prefillRestaurant?.name && prefillRestaurant?.place_id) {
        console.log('🔍 Looking for restaurant:', prefillRestaurant.name)
        
        // Check if restaurant already exists
        const existing = restaurantsData.find(r => r.name === prefillRestaurant.name)
        
        if (existing) {
          console.log('✅ Found existing restaurant:', existing.id)
          setSelectedRestaurant(existing.id)
        } else {
          console.log('➕ Creating new restaurant entry...')
          // Create new restaurant entry
          const { data: newRestaurant, error } = await supabase
            .from('restaurants')
            .insert({
              name: prefillRestaurant.name,
              formatted_address: prefillRestaurant.address || '',
              place_id: prefillRestaurant.place_id
            })
            .select()
            .single()
          
          if (error) {
            console.error('❌ Error creating restaurant:', error)
          } else if (newRestaurant) {
            console.log('✅ Created new restaurant:', newRestaurant.id)
            setRestaurants([...restaurantsData, newRestaurant])
            setSelectedRestaurant(newRestaurant.id)
          }
        }
      } else {
        console.log('ℹ️ No prefilled restaurant data')
      }
    }

    // Load profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .limit(100)

    if (profilesData) {
      setProfiles(profilesData)
    }
  }

  const loadInviteeAvatar = async (profileId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', profileId)
        .single()
      
      if (data?.avatar_url) {
        setInviteeAvatarUrl(data.avatar_url)
      }
    } catch (err) {
      console.error('Failed to load invitee avatar:', err)
    }
  }

  const loadReservation = async () => {
    setLoading(true)
    try {
      console.log('📥 Loading reservation:', reservationId)
      const data = await apiRequest<ReservationData>(
        API_CONFIG.endpoints.reservations.getById(reservationId!)
      )
      console.log('📊 Reservation loaded:', {
        id: data.id,
        organizer_id: data.organizer_id,
        currentUser,
        isOrganizer: data.organizer_id === currentUser
      })
      setReservation(data)
    } catch (err) {
      console.error('Failed to load reservation:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async () => {
    if (!reservationId || !currentUser) return
    
    setDeleting(true)
    try {
      // Delete the reservation from Supabase
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId)
        .eq('organizerId', currentUser) // Only organizer can delete
      
      if (error) {
        console.error('Failed to delete reservation:', error)
        alert('Failed to cancel reservation. Please try again.')
        return
      }
      
      console.log('✅ Reservation deleted successfully')
      setShowDeleteConfirm(false)
      onClose() // Close modal after successful deletion
    } catch (err) {
      console.error('Error canceling reservation:', err)
      alert('Failed to cancel reservation. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const addInvitee = () => {
    setInvitees([...invitees, { phone: '' }])
  }

  const removeInvitee = (index: number) => {
    setInvitees(invitees.filter((_, i) => i !== index))
  }

  const updateInvitee = (index: number, field: 'phone' | 'profileId', value: string) => {
    const updated = [...invitees]
    if (field === 'phone') {
      updated[index].phone = value
    } else {
      updated[index].profileId = value || undefined
    }
    setInvitees(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    // Check if user has phone number
    if (!userPhone) {
      // Show phone collection modal
      setShowPhoneModal(true)
      return
    }

    setLoading(true)

    try {
      // Format invitees (only if party size > 1)
      const inviteesFormatted = partySize > 1 ? invitees.map(inv => ({
        phone_e164: inv.phone.startsWith('+') ? inv.phone : `+${inv.phone}`,
        profile_id: inv.profileId || null
      })) : []

      const payload = {
        organizer_id: currentUser,
        restaurant_id: selectedRestaurant,
        starts_at_iso: new Date(dateTime).toISOString(),
        party_size: partySize,
        invitees: inviteesFormatted
      }

      const response = await apiRequest<any>(API_CONFIG.endpoints.reservations.send, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      console.log('✅ Reservation created:', response)

      // For party size 1, just show success and close (no invites to send)
      if (partySize === 1) {
        setSuccess(true)
        // Auto-close after a brief success message
        setTimeout(() => {
          onClose()
          resetForm()
        }, 1500)
        return
      }

      // Store invite message for user to send (party size > 1)
      const invites = response.invites || []
      
      if (invites.length > 0) {
        const invite = invites[0] // First (and usually only) invitee
        
        console.log('📱 Invite ready for:', invite.phoneE164)
        console.log('📝 Message text:', invite.text)
        
        // Store for display
        setInviteMessage(invite.text)
        setInvitePhone(invite.phoneE164)
      }
      
      setSuccess(true)
    } catch (err) {
      console.error('Failed to create reservation:', err)
      alert('Failed to create reservation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneSuccess = (phone: string) => {
    setUserPhone(phone)
    // Automatically retry submission after phone is collected
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      }
    }, 100)
  }

  const resetForm = () => {
    setSelectedRestaurant('')
    setDateTime('')
    setPartySize(1)
    setInvitees([])
    setSuccess(false)
    setInviteMessage('')
    setInvitePhone('')
    setCopied(false)
    setInviteeAvatarUrl(null)
  }

  const handleDownloadICS = () => {
    if (reservationId) {
      window.location.href = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.reservations.downloadICS(reservationId)}`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-700 border-green-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'canceled': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="reservation-modal"
        className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto relative border border-gray-100"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-2xl font-bold text-black">
              {mode === 'create' ? (step === 'intro' ? 'Send Reservation' : 'Create Reservation') : 'Reservation Details'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full w-10 h-10 p-0 hover:bg-black/10"
            >
              <X className="w-5 h-5 text-black" />
            </Button>
          </div>

          {/* Intro Step - Friend Invitation */}
          {mode === 'create' && step === 'intro' && prefillInvitee && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 relative z-10"
            >
              {/* Friend Info */}
              <div className="text-center space-y-3">
                {inviteeAvatarUrl ? (
                  <img
                    src={inviteeAvatarUrl}
                    alt={prefillInvitee.name}
                    className="w-24 h-24 rounded-full mx-auto shadow-lg object-cover border-2 border-white/50"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full gradient-purple-blue flex items-center justify-center mx-auto shadow-lg">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                )}
                <h3 className="text-2xl font-bold text-black">Invite {prefillInvitee.name} to dine</h3>
                <p className="text-gray-700 text-sm">
                  Create a reservation and {prefillInvitee.name} will receive an SMS invitation to confirm
                </p>
              </div>

              {/* Info Cards */}
              <div className="space-y-3">
                <div className="glass-layer-1 rounded-2xl px-5 py-4 relative overflow-hidden shadow-soft">
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-xl gradient-purple-blue flex items-center justify-center flex-shrink-0 shadow-md">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium">Next step</p>
                      <p className="text-sm font-semibold text-black">Choose restaurant & time</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={() => setStep('form')}
                className="w-full gradient-purple-blue text-white h-14 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                Continue to Form
              </Button>
            </motion.div>
          )}

          {/* Create Mode Form */}
          {mode === 'create' && step === 'form' && !success && (
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6 relative z-10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Back Button (if coming from intro) */}
              {showIntro && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('intro')}
                  className="text-sm text-gray-700 hover:text-black hover:bg-white/20"
                >
                  ← Back
                </Button>
              )}
              
              {/* Restaurant */}
              <div>
                <Label htmlFor="restaurant" className="text-sm font-semibold text-black mb-2 block">Restaurant</Label>
                <select
                  id="restaurant"
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  required
                  className="w-full p-3 glass-layer-1 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 text-black shadow-soft"
                >
                  <option value="">Select a restaurant...</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.formatted_address && `• ${r.formatted_address}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div>
                <Label htmlFor="datetime" className="text-sm font-semibold text-black mb-2 block">Date & Time</Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                  className="glass-layer-1 border-0 text-black shadow-soft"
                />
              </div>

              {/* Party Size */}
              <div>
                <Label htmlFor="partySize" className="text-sm font-semibold text-black mb-2 block">Party Size</Label>
                <Input
                  id="partySize"
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value))}
                  required
                  className="glass-layer-1 border-0 text-black shadow-soft"
                />
              </div>

              {/* Invitees (only show if party size > 1) */}
              {partySize > 1 && (
                <div>
                  <Label className="text-sm font-semibold text-black mb-2 block">Invitees</Label>
                  <div className="space-y-3">
                    {invitees.map((invitee, index) => (
                      <div key={`invitee-${index}-${invitee.phone || index}`} className="flex gap-2">
                        <Input
                          placeholder="+17149410453"
                          value={invitee.phone}
                          onChange={(e) => updateInvitee(index, 'phone', e.target.value)}
                          required
                          className="flex-1 glass-layer-1 border-0 text-black shadow-soft"
                        />
                        <select
                          value={invitee.profileId || ''}
                          onChange={(e) => updateInvitee(index, 'profileId', e.target.value)}
                          className="flex-1 p-3 glass-layer-1 rounded-xl border-0 text-black shadow-soft"
                        >
                          <option value="">Select profile (optional)</option>
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.display_name} (@{p.username})
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInvitee(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInvitee}
                  className="mt-3 w-full glass-layer-1 border-0 shadow-soft hover:shadow-md text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Invitee
                </Button>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-purple-blue text-white h-14 shadow-lg hover:shadow-xl transition-shadow"
              >
                {loading ? 'Sending...' : 'Send Reservation'}
              </Button>
            </motion.form>
          )}

          {/* Success State - Open iMessage Card */}
          {mode === 'create' && success && inviteMessage && invitePhone && (
            <motion.div 
              className="space-y-6 relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Success Header */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 mb-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Reservation Created!</h3>
                <p className="text-gray-600">Send this invitation to confirm your reservation</p>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Send to
                </Label>
                <div
                  onClick={async () => {
                    await navigator.clipboard.writeText(invitePhone)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                  className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3.5 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <span className="font-mono text-sm text-gray-900">{invitePhone}</span>
                  <div className="flex items-center gap-2">
                    <AnimatePresence>
                      {copied && (
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
                    {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Message
                </Label>
                <div
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteMessage)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                  className="bg-gray-50 rounded-2xl px-4 py-3.5 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 relative group"
                >
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed pr-8">
                    {inviteMessage}
                  </p>
                  <div className="absolute top-3 right-3">
                    {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    onClose()
                    resetForm()
                  }}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const encoded = encodeURIComponent(inviteMessage)
                    window.location.href = `sms:${invitePhone}?&body=${encoded}`
                  }}
                  className="flex-1 gradient-purple-blue text-white h-12"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Messages
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                If the message isn't pre-filled, copy it from above and paste into Messages.
              </p>
            </motion.div>
          )}

          {/* View Mode */}
          {mode === 'view' && reservation && (
            <motion.div 
              className="space-y-5 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Restaurant Images Gallery */}
              {reservation.restaurant.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 -mx-8 -mt-8 mb-6">
                  {reservation.restaurant.images.slice(0, 3).map((image, idx) => (
                    <div 
                      key={image.id}
                      className={`relative overflow-hidden ${
                        idx === 0 
                          ? 'col-span-3 aspect-[5/2]' 
                          : 'aspect-[4/3]'
                      } ${idx === 1 ? 'rounded-bl-3xl' : ''} ${idx === 2 ? 'rounded-br-3xl' : ''}`}
                    >
                      <img 
                        src={image.url} 
                        alt={image.description || image.dish || reservation.restaurant_name}
                        className="w-full h-full object-cover"
                      />
                      {image.dish && (
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {image.dish}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Header with status */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-black mb-1">{reservation.restaurant_name}</h3>
                  {reservation.restaurant.address && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {reservation.restaurant.address}
                    </p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(reservation.status)}`}>
                  {reservation.status.toUpperCase()}
                </span>
              </div>

              {/* Restaurant Details */}
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {reservation.restaurant.rating && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <Star className="w-4 h-4 fill-amber-600" />
                    <span className="font-medium">{reservation.restaurant.rating.toFixed(1)}</span>
                    {reservation.restaurant.user_ratings_total && (
                      <span className="text-gray-500">({reservation.restaurant.user_ratings_total})</span>
                    )}
                  </div>
                )}
                {reservation.restaurant.price_level && (
                  <div className="flex items-center text-gray-700">
                    {'$'.repeat(reservation.restaurant.price_level)}
                  </div>
                )}
                {reservation.restaurant.phone && (
                  <a href={`tel:${reservation.restaurant.phone}`} className="flex items-center gap-1 text-purple-600 hover:text-purple-700">
                    <Phone className="w-4 h-4" />
                    <span>{reservation.restaurant.phone}</span>
                  </a>
                )}
                {reservation.restaurant.website && (
                  <a href={reservation.restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-600 hover:text-purple-700">
                    <ExternalLink className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
                {reservation.restaurant.google_maps_url && (
                  <a href={reservation.restaurant.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-600 hover:text-purple-700">
                    <MapPin className="w-4 h-4" />
                    <span>View on Maps</span>
                  </a>
                )}
              </div>

              {/* Restaurant Description */}
              {reservation.restaurant.description && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">{reservation.restaurant.description}</p>
                </div>
              )}

              {/* Reservation Details */}
              <div className="flex items-center gap-6 text-sm pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-700">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {format(parseISO(reservation.starts_at), 'MMM d, yyyy • h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{reservation.party_size} people</span>
                </div>
              </div>

              {/* Invites */}
              {reservation.invites && reservation.invites.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-black mb-3">
                    Invites ({reservation.invites.length})
                  </h4>
                  <div className="space-y-1.5">
                    {reservation.invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-gray-700">
                          {invite.inviteeName || invite.inviteePhoneE164}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          invite.rsvpStatus === 'yes' ? 'bg-green-100 text-green-700' :
                          invite.rsvpStatus === 'no' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {invite.rsvpStatus.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancel Button - Always show for organizer */}
              {(() => {
                console.log('🔍 CANCEL BUTTON DEBUG:', {
                  currentUser,
                  organizerId: reservation.organizer_id,
                  matches: reservation.organizer_id === currentUser,
                  willShow: currentUser && reservation.organizer_id === currentUser,
                  reservationData: reservation
                });
                return currentUser && reservation.organizer_id === currentUser;
              })() && (
                <div className="pt-6 border-t border-gray-100">
                  {!showDeleteConfirm ? (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Reservation
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-900 mb-1">
                              Are you sure?
                            </p>
                            <p className="text-sm text-red-700">
                              This will permanently delete the reservation. This action cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowDeleteConfirm(false)}
                          variant="outline"
                          className="flex-1"
                          disabled={deleting}
                        >
                          Keep Reservation
                        </Button>
                        <Button
                          onClick={handleCancelReservation}
                          disabled={deleting}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {deleting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Canceling...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Yes, Cancel It
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Loading View Mode */}
          {mode === 'view' && loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse" />
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Phone Collection Modal */}
      <PhoneCollectionModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={handlePhoneSuccess}
      />
    </AnimatePresence>
  )
}

