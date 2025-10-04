/**
 * JWT Token utilities for reservation actions
 * Handles signing and verifying action tokens with single-use enforcement
 */

export interface ActionTokenPayload {
  inviteId?: string
  resvId: string
  userId?: string
  action: 'invite_accept' | 'invite_decline' | 'owner_cancel'
  jti: string  // JWT ID for single-use enforcement
  exp: number  // Expiration timestamp
}

/**
 * Sign an action token (client-side helper - actual signing happens on server)
 * This is just for type safety and payload structure
 */
export function buildActionPayload(
  resvId: string,
  action: ActionTokenPayload['action'],
  inviteId?: string,
  userId?: string
): Omit<ActionTokenPayload, 'jti' | 'exp'> {
  return {
    resvId,
    action,
    ...(inviteId && { inviteId }),
    ...(userId && { userId })
  }
}

/**
 * Decode JWT without verification (client-side preview only)
 * DO NOT USE FOR SECURITY - only for UI hints
 */
export function decodeTokenUnsafe(token: string): ActionTokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return payload as ActionTokenPayload
  } catch {
    return null
  }
}

/**
 * Check if token is expired (client-side check only)
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenUnsafe(token)
  if (!payload || !payload.exp) return true
  
  return Date.now() >= payload.exp * 1000
}
