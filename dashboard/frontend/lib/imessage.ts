/**
 * iMessage deep link utilities for sending reservation invites
 */

export interface InviteTextParams {
  restaurantName: string
  startsAtLocal: string  // e.g., "Saturday, Oct 5 at 7:00 PM"
  inviteUrl: string      // e.g., "https://yummy.app/r/invite?token=..."
}

/**
 * Build the invitation message text
 */
export function buildInviteText(params: InviteTextParams): string {
  return `🍽️ Join me at ${params.restaurantName} on ${params.startsAtLocal}! Tap to accept: ${params.inviteUrl}`
}

/**
 * Build the iMessage/SMS deep link href
 * Uses sms: scheme which works consistently across platforms
 * 
 * Format: sms:<phone>?&body=<message>
 * - Works on iOS, macOS, Android
 * - Browser prompts to open Messages app
 * - Some versions may ignore body= (that's why we show copyable text)
 */
export function buildMessagesHref(toE164: string, body: string): string {
  const encoded = encodeURIComponent(body)
  // Use sms: scheme with ?& separator (iOS compatibility)
  return `sms:${toE164}?&body=${encoded}`
}

/**
 * Check if platform is likely Apple (iOS/macOS)
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const platform = navigator.platform || ''
  return /\b(iPhone|iPad|iPod|Macintosh|Mac OS X|MacIntel)\b/.test(ua + platform)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
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

/**
 * Use Web Share API if available, fallback to copy
 */
export async function shareOrCopy(text: string): Promise<'shared' | 'copied' | 'failed'> {
  // Try Web Share API first (mobile)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch {
      // User canceled or not supported
    }
  }
  
  // Fallback to clipboard
  const copied = await copyToClipboard(text)
  return copied ? 'copied' : 'failed'
}

/**
 * Format phone number for display
 * +14155551234 → (415) 555-1234
 */
export function formatPhoneForDisplay(e164: string): string {
  // Remove + and country code (assume US +1 for now)
  const cleaned = e164.replace(/\D/g, '')
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US number
    const number = cleaned.substring(1)
    return `(${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`
  }
  
  // Return as-is for non-US numbers
  return e164
}
