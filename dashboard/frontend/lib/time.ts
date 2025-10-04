/**
 * Time formatting utilities for reservations
 */

/**
 * Format a Date to local string for display
 * @param dt - Date object (assumed UTC)
 * @param locale - Optional locale string (default: 'en-US')
 * @returns Formatted string like "Saturday, October 5 at 7:00 PM"
 */
export function formatLocal(dt: Date, locale: string = 'en-US'): string {
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
  
  const datePart = dt.toLocaleDateString(locale, dateOptions)
  const timePart = dt.toLocaleTimeString(locale, timeOptions)
  
  return `${datePart} at ${timePart}`
}

/**
 * Format date for SMS (shorter)
 * @returns String like "Sat, Oct 5, 7:00 PM"
 */
export function formatForSMS(dt: Date): string {
  return dt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
