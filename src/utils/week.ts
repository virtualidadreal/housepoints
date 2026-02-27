import type { Household, WeekResult } from '../lib/types'

/**
 * Calculate the current week_id (e.g. "2026-W09") based on the household's
 * configured close day and hour.
 *
 * The "week" runs from close-time to close-time. For example, if close is
 * Sunday 23:59, the week that ends on Sun 2026-03-01 23:59 is "2026-W09".
 * We derive the week_id from the close date's ISO week number.
 */
export function getCurrentWeekId(household: Household): string {
  const bounds = getCurrentWeekBounds(household)
  // The week_id is derived from the end date
  return formatWeekId(bounds.end)
}

/**
 * Get the start and end timestamps for a given week_id.
 */
export function getWeekBounds(
  weekId: string,
  household: Household
): { start: Date; end: Date } {
  const [yearStr, weekStr] = weekId.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)

  // Find the Thursday of the ISO week (ISO weeks are defined by their Thursday)
  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7 // Mon=1 ... Sun=7
  const mondayOfWeek1 = new Date(jan4)
  mondayOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1)

  // Monday of the target week
  const mondayOfTarget = new Date(mondayOfWeek1)
  mondayOfTarget.setDate(mondayOfWeek1.getDate() + (week - 1) * 7)

  // Close day offset from Monday (0=Sun means offset 6 from Monday)
  const closeDayFromMon = household.week_close_day === 0 ? 6 : household.week_close_day - 1

  // End = close day/hour of target week
  const end = new Date(mondayOfTarget)
  end.setDate(mondayOfTarget.getDate() + closeDayFromMon)
  end.setHours(household.week_close_hour, household.week_close_minute, 0, 0)

  // Start = 7 days before end
  const start = new Date(end)
  start.setDate(end.getDate() - 7)

  return { start, end }
}

/**
 * Calculate the time remaining until the current week closes.
 * Returns milliseconds. Negative means already closed.
 */
export function getTimeUntilClose(household: Household): number {
  const bounds = getCurrentWeekBounds(household)
  return bounds.end.getTime() - Date.now()
}

/**
 * Check if the current week has already been closed (has a WeekResult).
 */
export function isWeekClosed(
  household: Household,
  weekResults: WeekResult[]
): boolean {
  const weekId = getCurrentWeekId(household)
  return weekResults.some(
    (r) => r.household_id === household.id && r.week_id === weekId
  )
}

// --- Internal helpers ---

function getCurrentWeekBounds(household: Household): { start: Date; end: Date } {
  const now = new Date()

  // Find the next occurrence of the close day/time
  const closeDay = household.week_close_day // 0=Sun, 6=Sat
  const currentDay = now.getDay()

  let daysUntilClose = closeDay - currentDay
  if (daysUntilClose < 0) daysUntilClose += 7

  const nextClose = new Date(now)
  nextClose.setDate(now.getDate() + daysUntilClose)
  nextClose.setHours(household.week_close_hour, household.week_close_minute, 0, 0)

  // If we're past the close time today and it's the close day, move to next week
  if (daysUntilClose === 0 && now > nextClose) {
    nextClose.setDate(nextClose.getDate() + 7)
  }

  const end = nextClose
  const start = new Date(end)
  start.setDate(end.getDate() - 7)

  return { start, end }
}

function formatWeekId(date: Date): string {
  // ISO week number calculation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
