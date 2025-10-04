'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { apiRequest, API_CONFIG } from '@/lib/api-config'

interface ReservationData {
  id: string
  organizerId: string
  restaurantId: string
  restaurantName: string
  restaurantAddress: string | null
  startsAt: string
  partySize: number
  status: string
  invites: Array<{
    id: string
    inviteePhoneE164: string
    rsvpStatus: string
    respondedAt: string | null
  }>
}

export default function ReservationDetailPage() {
  const params = useParams()
  const reservationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const featureEnabled = process.env.NEXT_PUBLIC_RESERVATIONS_ENABLED !== 'false'

  useEffect(() => {
    if (!featureEnabled) return

    async function loadReservation() {
      try {
        // Get current user (for auth check)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setCurrentUserId(user.id)
        }

        // Fetch reservation data from backend
        const data = await apiRequest<ReservationData>(
          API_CONFIG.endpoints.reservations.getById(reservationId)
        )
        setReservation(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reservation')
      } finally {
        setLoading(false)
      }
    }

    loadReservation()
  }, [reservationId, featureEnabled])

  const handleDownloadICS = () => {
    window.location.href = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.reservations.downloadICS(reservationId)}`
  }

  const handleCancel = async () => {
    if (!currentUserId) return

    // Generate cancel token on client side (in production, do this server-side)
    const cancelUrl = `/r/cancel?token=GENERATE_ON_SERVER`
    window.location.href = cancelUrl
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-2xl w-full">
          <p className="text-center text-gray-600">Loading reservation...</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-4">Not Found</h1>
          <p className="text-gray-600">This reservation could not be found.</p>
        </Card>
      </div>
    )
  }

  const isOrganizer = currentUserId === reservation.organizerId
  const canCancel = isOrganizer && ['pending', 'confirmed'].includes(reservation.status)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 max-w-2xl w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Reservation Details</h1>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              reservation.status === 'canceled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {reservation.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <h3 className="font-medium text-gray-700">Restaurant</h3>
            <p className="text-lg">{reservation.restaurantName}</p>
            {reservation.restaurantAddress && (
              <p className="text-sm text-gray-500">{reservation.restaurantAddress}</p>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Date & Time</h3>
            <p className="text-lg">
              {format(new Date(reservation.startsAt), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-lg">
              {format(new Date(reservation.startsAt), 'h:mm a')} ET
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Party Size</h3>
            <p className="text-lg">{reservation.partySize} people</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">Invites ({reservation.invites.length})</h3>
          <div className="space-y-2">
            {reservation.invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <span className="text-sm">{invite.inviteePhoneE164}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  invite.rsvpStatus === 'yes' ? 'bg-green-100 text-green-800' :
                  invite.rsvpStatus === 'no' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {invite.rsvpStatus.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleDownloadICS} className="w-full" variant="outline">
            📅 Add to Calendar
          </Button>

          {canCancel && (
            <Button
              onClick={handleCancel}
              variant="destructive"
              className="w-full"
            >
              Cancel Reservation
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

