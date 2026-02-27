import { useMemo } from 'react'
import { useHouseholdStore } from '../store/household'
import type { Task, TaskLog } from '../lib/types'

export interface PendingTask {
  task: Task
  daysSinceLastDone: number
  urgency: 'low' | 'medium' | 'high'
}

const FREQUENCY_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
}

function getUrgency(daysSince: number, expectedDays: number): 'low' | 'medium' | 'high' {
  const ratio = daysSince / expectedDays
  if (ratio >= 3) return 'high'
  if (ratio >= 2) return 'medium'
  return 'low'
}

export function usePendingTasks(): PendingTask[] {
  const tasks = useHouseholdStore((s) => s.tasks)
  const weekData = useHouseholdStore((s) => s.weekData)

  return useMemo(() => {
    if (!weekData) return []

    const now = Date.now()
    const allLogs = weekData.taskLogs

    return tasks
      .filter((t) => t.frequency !== 'asneeded' && !t.is_bonus)
      .map((task) => {
        // Find the most recent log for this task (by any user)
        const taskLogs = allLogs.filter((l: TaskLog) => l.task_id === task.id)
        const lastLog = taskLogs.length > 0
          ? taskLogs.reduce((latest: TaskLog, log: TaskLog) =>
              new Date(log.created_at) > new Date(latest.created_at) ? log : latest
            )
          : null

        const expectedDays = FREQUENCY_DAYS[task.frequency] ?? 7

        if (!lastLog) {
          // Never done — show as overdue based on frequency
          return {
            task,
            daysSinceLastDone: expectedDays + 1,
            urgency: getUrgency(expectedDays + 1, expectedDays),
          }
        }

        const daysSince = Math.floor(
          (now - new Date(lastLog.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSince < expectedDays) return null

        return {
          task,
          daysSinceLastDone: daysSince,
          urgency: getUrgency(daysSince, expectedDays),
        }
      })
      .filter((p): p is PendingTask => p !== null)
      .sort((a, b) => b.daysSinceLastDone - a.daysSinceLastDone)
  }, [tasks, weekData])
}
