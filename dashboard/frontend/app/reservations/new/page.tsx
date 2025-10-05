'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { apiRequest, API_CONFIG } from '@/lib/api-config'

interface Restaurant {
  id: string
  name: string
  formatted_address: string | null
}

interface Profile {
  id: string
  username: string
  display_name: string
}

export default function NewReservationPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [invitees, setInvitees] = useState<Array<{ phone: string; profileId?: string }>>([
    { phone: '' },
  ])

  // Feature flag check
  const featureEnabled = process.env.NEXT_PUBLIC_RESERVATIONS_ENABLED !== 'false'

  useEffect(() => {
    if (!featureEnabled) return

    async function loadData() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user.id)
      }

      // Load restaurants
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('id, name, formatted_address')
        .limit(100)

      if (restaurantsData) {
        setRestaurants(restaurantsData)
      }

      // Load profiles (friends)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .limit(100)

      if (profilesData) {
        setProfiles(profilesData)
      }

      // Check for pre-filled invitee from query params
      const params = new URLSearchParams(window.location.search)
      const inviteeId = params.get('inviteeId')
      const inviteeName = params.get('inviteeName')
      const inviteePhone = params.get('inviteePhone')

      if (inviteePhone) {
        setInvitees([{
          phone: inviteePhone,
          profileId: inviteeId || undefined,
        }])
      }
    }

    loadData()
  }, [featureEnabled, supabase])

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
    setLoading(true)
    setError(null)

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to create a reservation')
      }

      // Validate inputs
      if (!selectedRestaurant) {
        throw new Error('Please select a restaurant')
      }

      if (!dateTime) {
        throw new Error('Please select a date and time')
      }

      const validInvitees = invitees.filter((inv) => inv.phone.trim())
      if (validInvitees.length === 0) {
        throw new Error('Please add at least one invitee')
      }

      // Format invitees for API
      const formattedInvitees = validInvitees.map((inv) => ({
        phone_e164: inv.phone.startsWith('+') ? inv.phone : `+1${inv.phone}`,
        profile_id: inv.profileId,
      }))

      // Convert datetime to ISO string
      const starts_at_iso = new Date(dateTime).toISOString()

      const data = await apiRequest<{ ok: boolean; reservation_id: string; invites_sent: number }>(
        API_CONFIG.endpoints.reservations.send,
        {
          method: 'POST',
          body: JSON.stringify({
            organizer_id: currentUser,
            restaurant_id: selectedRestaurant,
            starts_at_iso,
            party_size: partySize,
            invitees: formattedInvitees,
          }),
        }
      )

      setSuccess(true)
      setReservationId(data.reservation_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!featureEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Feature Unavailable</h1>
          <p className="text-gray-600">
            The reservations feature is currently disabled.
          </p>
        </Card>
      </div>
    )
  }

  if (success && reservationId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold mb-4">Reservation Sent!</h1>
            <p className="text-gray-600 mb-6">
              Your invitations have been sent via SMS. Invitees can reply YES or NO, or click the confirmation link.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push(`/reservations/${reservationId}`)}
                className="w-full"
              >
                View Reservation
              </Button>
              <Button
                onClick={() => router.push('/reservations/new')}
                variant="outline"
                className="w-full"
              >
                Create Another
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6">Create Reservation</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Restaurant</label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select a restaurant...</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                  {restaurant.formatted_address && ` - ${restaurant.formatted_address}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date & Time</label>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Party Size</label>
            <Input
              type="number"
              min="1"
              max="50"
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Invitees</label>
            <div className="space-y-3">
              {invitees.map((invitee, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={invitee.phone}
                    onChange={(e) => updateInvitee(index, 'phone', e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={invitee.profileId || ''}
                    onChange={(e) => updateInvitee(index, 'profileId', e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="">Optional: Link to profile</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.display_name} (@{profile.username})
                      </option>
                    ))}
                  </select>
                  {invitees.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeInvitee(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addInvitee}
              className="mt-3"
            >
              + Add Invitee
            </Button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-layer-1 h-14 rounded-full shadow-soft relative overflow-hidden flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-102 active:scale-98"
          >
            {/* Specular highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
            
            <span className="font-semibold relative z-10">
              {loading ? 'Sending...' : 'Send Reservation'}
            </span>
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Invitees will receive an SMS with YES/NO options and a confirmation link.
        </p>
      </Card>
    </div>
  )
}

