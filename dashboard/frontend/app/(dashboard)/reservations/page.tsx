'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { format, isSameDay, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { apiRequest, API_CONFIG } from '@/lib/api-config'
import { Calendar as CalendarIcon, Plus, Users, Clock, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { ReservationModal } from '@/components/reservation-modal'

interface Invitee {
  phone: string
  status: string
  name?: string
}

interface Reservation {
  id: string
  organizer_id: string
  restaurant_id: string
  restaurant_name: string
  restaurant_address: string | null
  starts_at: string
  party_size: number
  status: string
  created_at: string
  is_organizer: boolean
  invite_count?: number
  rsvp_status?: string
  invitees?: Invitee[]
}

export default function ReservationsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'view'>('create')
  const [selectedReservationId, setSelectedReservationId] = useState<string | undefined>()
  const [prefillRestaurant, setPrefillRestaurant] = useState<{ name?: string; address?: string; place_id?: string } | undefined>()

  useEffect(() => {
    setMounted(true)
    
    // Check if we should auto-open the reservation modal
    const params = new URLSearchParams(window.location.search)
    const shouldAutoOpen = params.get('autoOpen') === 'true'
    
    if (shouldAutoOpen) {
      // Extract restaurant data from URL params
      const restaurantName = params.get('restaurant_name')
      const restaurantAddress = params.get('restaurant_address')
      const placeId = params.get('place_id')
      
      console.log('🔗 URL params:', { restaurantName, restaurantAddress, placeId })
      
      if (restaurantName) {
        const restaurantData = {
          name: restaurantName,
          address: restaurantAddress || undefined,
          place_id: placeId || undefined
        }
        console.log('📝 Setting prefillRestaurant:', restaurantData)
        setPrefillRestaurant(restaurantData)
      }
      
      setModalMode('create')
      setModalOpen(true)
      
      // Clean up URL by removing the parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('autoOpen')
      url.searchParams.delete('restaurant_name')
      url.searchParams.delete('restaurant_address')
      url.searchParams.delete('place_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  useEffect(() => {
    async function loadReservations() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/')
          return
        }
        
        setCurrentUserId(user.id)

        // Fetch reservations from backend
        const data = await apiRequest<{ reservations: Reservation[] }>(
          `/api/reservations/user/${user.id}`
        )
        
        setReservations(data.reservations || [])
      } catch (err) {
        console.error('Failed to load reservations:', err)
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [supabase, router])

  // Get reservations for selected date
  const selectedDateReservations = selectedDate
    ? reservations.filter(r => isSameDay(parseISO(r.starts_at), selectedDate))
    : []

  // Get upcoming reservations (future only)
  const upcomingReservations = reservations
    .filter(r => new Date(r.starts_at) >= new Date())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 5)

  // Days with reservations (for calendar highlighting)
  const daysWithReservations = reservations.map(r => parseISO(r.starts_at))

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      canceled: 'bg-gray-100 text-gray-600 border-gray-200'
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-auto">
      {/* Header */}
      <div className="border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">
              Reservations
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {reservations.length} total • {upcomingReservations.length} upcoming
            </p>
          </div>
          
          <Button
            onClick={() => {
              setModalMode('create')
              setSelectedReservationId(undefined)
              setModalOpen(true)
            }}
            className="gradient-purple-blue text-white shadow-soft hover:shadow-md transition-shadow h-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Reservation
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full gradient-purple-blue animate-pulse" />
        </div>
      ) : (
        <div className="flex-1 flex gap-6 p-8">
          {/* Calendar Column */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm h-full flex flex-col">              
              <div className="flex-1 flex items-start justify-center pt-4 max-w-full">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    booked: daysWithReservations
                  }}
                  modifiersClassNames={{
                    booked: 'font-bold text-purple-600 bg-purple-50 ring-2 ring-purple-200'
                  }}
                />
              </div>

              {/* Reservations for Selected Date */}
              {selectedDate && selectedDateReservations.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-black mb-4">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </h3>
                  
                  <div className="space-y-2">
                    {selectedDateReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-100"
                        onClick={() => {
                          setModalMode('view')
                          setSelectedReservationId(reservation.id)
                          setModalOpen(true)
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-black">{reservation.restaurant_name}</h4>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadge(reservation.status)}`}>
                            {reservation.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(parseISO(reservation.starts_at), 'h:mm a')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {reservation.party_size}
                          </div>
                          {!reservation.is_organizer && (
                            <span className="text-xs text-gray-500">Guest</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming List */}
          <div className="w-80">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold text-black mb-4">Upcoming</h2>
              
              {upcomingReservations.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No upcoming reservations</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setModalMode('create')
                      setSelectedReservationId(undefined)
                      setModalOpen(true)
                    }}
                    className="w-full border-gray-200 hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create One
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-100"
                      onClick={() => {
                        setModalMode('view')
                        setSelectedReservationId(reservation.id)
                        setModalOpen(true)
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(reservation.status)}`}>
                          {reservation.status}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-sm text-black mb-2">{reservation.restaurant_name}</h4>
                      
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3 h-3" />
                          {format(parseISO(reservation.starts_at), 'MMM d, h:mm a')}
                        </div>
                        
                        {/* Show all invitees */}
                        {reservation.invitees && reservation.invitees.length > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-1 mb-1.5">
                              <Users className="w-3 h-3" />
                              <span className="font-medium">Invitees:</span>
                            </div>
                            <div className="space-y-1 pl-4">
                              {reservation.invitees.map((invitee, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="text-xs">
                                    {invitee.name || invitee.phone}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    invitee.status === 'yes' ? 'bg-green-100 text-green-700' :
                                    invitee.status === 'no' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {invitee.status === 'yes' ? '✓' : invitee.status === 'no' ? '✗' : '...'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {reservation.is_organizer && (
                          <div className="text-purple-600 font-medium pt-1">
                            You're organizing
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setPrefillRestaurant(undefined) // Clear prefill data
          // Reload reservations after modal closes
          if (currentUserId) {
            loadReservations()
          }
        }}
        mode={modalMode}
        reservationId={selectedReservationId}
        prefillRestaurant={prefillRestaurant}
      />
    </div>
  )
  
  async function loadReservations() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const data = await apiRequest<{ reservations: Reservation[] }>(
        `/api/reservations/user/${user.id}`
      )
      
      setReservations(data.reservations || [])
    } catch (err) {
      console.error('Failed to reload reservations:', err)
    }
  }
}

