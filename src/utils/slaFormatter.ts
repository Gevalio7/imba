/**
 * Formats SLA time values for display
 * @param value - Time value (hours for responseTime, minutes for solutionTime)
 * @param isHours - Whether the value represents hours (responseTime) or minutes (solutionTime)
 * @returns Formatted string like "2ч 30м" or "1д 3ч"
 */
export function formatSlaTime(value: number | null | undefined, isHours: boolean = false): string {
  if (!value) return '-'

  if (isHours) {
    // For responseTime - this is hours
    if (value < 1) return `${Math.round(value * 60)} мин`
    if (value < 24) return `${value}ч`
    const days = Math.floor(value / 24)
    const hours = Math.round(value % 24)
    return hours > 0 ? `${days}д ${hours}ч` : `${days}д`
  } else {
    // For solutionTime - this is minutes
    if (value < 60) return `${value} мин`
    const hours = Math.floor(value / 60)
    const mins = value % 60
    if (hours < 24) return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}д ${remainingHours}ч` : `${days}д`
  }
}

/**
 * Formats deadline date for display
 * @param date - Date object to format
 * @returns Formatted string like "15.04.2026 14:30"
 */
export function formatDeadline(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats date string for display with time
 * @param dateStr - Date string to format
 * @returns Formatted string like "15.04.2026 14:30"
 */
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return ''

  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats date string for display without time
 * @param dateStr - Date string to format
 * @returns Formatted string like "15.04.2026"
 */
export function formatDateOnly(dateStr: string | null): string {
  if (!dateStr) return ''

  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}