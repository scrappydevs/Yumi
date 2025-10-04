'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { apiRequest, API_CONFIG } from '@/lib/api-config'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function ConfirmReservationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<{
    resvId: string
    action: string
  } | null>(null)

  useEffect(() => {
    if (token) {
      // Decode token on backend for security - for now just show generic info
      setTokenInfo({
        resvId: 'pending',
        action: 'confirm',
      })
    }
  }, [token])

  const handleConfirm = async () => {
    if (!token) {
      setError('Missing confirmation token')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await apiRequest(API_CONFIG.endpoints.reservations.confirm, {
        method: 'POST',
        body: JSON.stringify({ token }),
      })

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm reservation')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
          <p className="text-gray-600">
            This confirmation link is invalid. Please check your message and try again.
          </p>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-4">Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Your reservation has been confirmed. A calendar event has been added to your account.
            </p>
            <p className="text-sm text-gray-500">
              You can close this window now.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Confirm Your Reservation</h1>
        
        {tokenInfo && (
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              You're about to confirm your attendance at this reservation.
            </p>
            <p className="text-sm text-gray-500">
              Reservation ID: {tokenInfo.resvId.slice(0, 8)}...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Confirming...' : 'Confirm Reservation'}
        </Button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          By confirming, you agree to attend this reservation.
        </p>
      </Card>
    </div>
  )
}

export default function ConfirmReservationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    }>
      <ConfirmReservationContent />
    </Suspense>
  )
}

