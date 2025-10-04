/**
 * Backend API configuration
 * All reservations API calls go through the Python/FastAPI backend
 */

export const API_CONFIG = {
  // Backend API base URL
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  
  // API endpoints
  endpoints: {
    reservations: {
      send: '/api/reservations/send',
      confirm: '/api/reservations/confirm',
      ownerCancel: '/api/reservations/owner-cancel',
      getById: (id: string) => `/api/reservations/${id}`,
      downloadICS: (id: string) => `/api/reservations/${id}/ics`,
    },
  },
}

/**
 * Make an API request to the backend
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.baseURL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.detail || 'Request failed')
  }

  return response.json()
}

