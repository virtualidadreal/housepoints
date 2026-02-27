import type { TaskLog } from '../lib/types'

/**
 * Sum all valid points for a user in a given set of task logs.
 * Only counts logs that are not invalidated (resolved_invalid).
 */
export function calculateWeekPoints(taskLogs: TaskLog[], userId: string): number {
  return taskLogs
    .filter(
      (log) =>
        log.user_id === userId && log.dispute_status !== 'resolved_invalid'
    )
    .reduce((sum, log) => sum + log.points, 0)
}

/**
 * Determine the winner based on points and tie threshold.
 * Returns 'tie' if the difference percentage is below the threshold.
 */
export function determineWinner(
  user1Points: number,
  user2Points: number,
  tieThreshold: number
): 'user1' | 'user2' | 'tie' {
  const total = user1Points + user2Points
  if (total === 0) return 'tie'

  const diff = Math.abs(user1Points - user2Points)
  const diffPercentage = (diff / total) * 100

  if (diffPercentage < tieThreshold) return 'tie'
  return user1Points > user2Points ? 'user1' : 'user2'
}

/**
 * Format points with comma separators for display.
 */
export function formatPoints(points: number): string {
  return points.toLocaleString('es-ES')
}
