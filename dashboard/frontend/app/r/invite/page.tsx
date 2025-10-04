'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { decodeTokenUnsafe, isTokenExpired } from '@/lib/tokens'
import { format } from 'date-fns'
import { Calendar, Users, MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [tokenData, setTokenData] = useState<any>(null)
  const [reservationInfo, setReservationInfo] = useState<any>(null)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [result, setResult] = useState<'accepted' | 'declined' | null>(null)
  
  const token = searchParams?.get('token')
  const resume = searchParams?.get('resume')

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      // Check if user is logged in
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        // Store token and redirect to login
        if (token) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('pendingInviteToken', token)
          }
          router.push('/')
          return
        }
      }
      
      setUser(authUser)
      
      // Load token (from query or storage)
      let activeToken = token
      if (resume && typeof window !== 'undefined') {
        activeToken = sessionStorage.getItem('pendingInviteToken')
        if (activeToken) {
          sessionStorage.removeItem('pendingInviteToken')
        }
      }
      
      if (!activeToken) {
        router.push('/')
        return
      }
      
      // Decode token for preview
      const decoded = decodeTokenUnsafe(activeToken)
      if (!decoded) {
        throw new Error('Invalid token')
      }
      
      if (isTokenExpired(activeToken)) {
        throw new Error('This invitation has expired')
      }
      
      setTokenData({ ...decoded, rawToken: activeToken })
      
      // Fetch reservation details for preview
      const response = await fetch(`http://localhost:8000/api/reservations/${decoded.resvId}`)
      if (response.ok) {
        const data = await response.json()
        setReservationInfo(data)
      }
      
    } catch (err) {
      console.error('Error loading invite:', err)
      alert(err instanceof Error ? err.message : 'Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!tokenData || !user) return
    
    setAccepting(true)
    try {
      const response = await fetch('http://localhost:8000/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: tokenData.rawToken,
          user_id: user.id 
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to accept invitation')
      }
      
      setResult('accepted')
      
      // Redirect to reservations page after 2 seconds
      setTimeout(() => {
        router.push('/reservations')
      }, 2000)
    } catch (err) {
      console.error('Error accepting invite:', err)
      alert(err instanceof Error ? err.message : 'Failed to accept invitation. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    if (!tokenData || !user) return
    
    setDeclining(true)
    try {
      const response = await fetch('http://localhost:8000/api/invites/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: tokenData.rawToken,
          user_id: user.id
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to decline invitation')
      }
      
      setResult('declined')
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/overview')
      }, 2000)
    } catch (err) {
      console.error('Error declining invite:', err)
      alert(err instanceof Error ? err.message : 'Failed to decline invitation. Please try again.')
    } finally {
      setDeclining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="w-16 h-16 rounded-full gradient-purple-blue animate-pulse" />
      </div>
    )
  }

  if (result === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <Card className="p-8 max-w-md w-full glass-layer-1 shadow-strong text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-black">Accepted!</h1>
          <p className="text-gray-700">
            You're all set. Redirecting to reservation details...
          </p>
        </Card>
      </div>
    )
  }

  if (result === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <Card className="p-8 max-w-md w-full glass-layer-1 shadow-strong text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-black">Declined</h1>
          <p className="text-gray-700">
            No worries! The organizer has been notified.
          </p>
        </Card>
      </div>
    )
  }

  if (!reservationInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <Card className="p-8 max-w-md w-full glass-layer-1 shadow-strong text-center">
          <h1 className="text-2xl font-bold mb-2 text-black">Invitation Not Found</h1>
          <p className="text-gray-700 mb-4">
            This invitation link is invalid or has expired.
          </p>
          <Button onClick={() => router.push('/overview')} className="w-full">
            Go to Home
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <Card className="p-8 max-w-2xl w-full glass-layer-1 shadow-strong relative overflow-hidden">
        {/* Specular highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🍽️</div>
            <h1 className="text-3xl font-bold mb-2 text-black">You're Invited!</h1>
            <p className="text-gray-700">
              You've been invited to join a dinner reservation
            </p>
          </div>

          {/* Reservation Details */}
          <div className="space-y-4 mb-8">
            <div className="glass-layer-1 rounded-2xl p-5 shadow-soft relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Restaurant</h3>
                <p className="text-xl font-bold text-black">{reservationInfo.restaurant_name}</p>
                {reservationInfo.restaurant_address && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                    <MapPin className="w-4 h-4" />
                    {reservationInfo.restaurant_address}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-layer-1 rounded-2xl p-5 shadow-soft relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Date & Time
                  </h3>
                  <p className="font-bold text-black text-sm">
                    {format(new Date(reservationInfo.starts_at), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(new Date(reservationInfo.starts_at), 'h:mm a')}
                  </p>
                </div>
              </div>

              <div className="glass-layer-1 rounded-2xl p-5 shadow-soft relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Party Size
                  </h3>
                  <p className="text-lg font-bold text-black">{reservationInfo.party_size} people</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={accepting || declining}
              className="flex-1 gradient-purple-blue text-white h-14 shadow-lg hover:shadow-xl transition-shadow"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDecline}
              disabled={accepting || declining}
              variant="outline"
              className="flex-1 glass-layer-1 border-0 shadow-soft hover:shadow-md text-black h-14"
            >
              {declining ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 mr-2" />
                  Decline
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

