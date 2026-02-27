import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/household'
import type { TaskLog } from '../lib/types'

export function useRealtime() {
  const household = useHouseholdStore((s) => s.household)
  const weekData = useHouseholdStore((s) => s.weekData)
  const addTaskLog = useHouseholdStore((s) => s.addTaskLog)

  useEffect(() => {
    if (!household || !weekData) return

    const channel = supabase
      .channel(`task_logs_${household.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_logs',
          filter: `household_id=eq.${household.id}`,
        },
        (payload) => {
          const newLog = payload.new as TaskLog
          // Only add if it's for the current week and not already in the list
          if (newLog.week_id === weekData.weekId) {
            const exists = weekData.taskLogs.some((l) => l.id === newLog.id)
            if (!exists) {
              addTaskLog(newLog)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [household?.id, weekData?.weekId])
}
