import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/household'
import { getCurrentWeekId } from '../utils/week'
import { calculateWeekPoints } from '../utils/points'
import type { TaskLog } from '../lib/types'

export function useWeekData() {
  const [loading, setLoading] = useState(true)
  const household = useHouseholdStore((s) => s.household)
  const setWeekData = useHouseholdStore((s) => s.setWeekData)

  useEffect(() => {
    if (!household) return
    loadWeekData()
  }, [household?.id])

  async function loadWeekData() {
    if (!household) return

    const weekId = getCurrentWeekId(household)

    const { data: logs } = await supabase
      .from('task_logs')
      .select('*')
      .eq('household_id', household.id)
      .eq('week_id', weekId)
      .order('created_at', { ascending: false })

    const taskLogs = (logs ?? []) as TaskLog[]
    const user1Points = household.user1_id
      ? calculateWeekPoints(taskLogs, household.user1_id)
      : 0
    const user2Points = household.user2_id
      ? calculateWeekPoints(taskLogs, household.user2_id)
      : 0

    setWeekData({ weekId, taskLogs, user1Points, user2Points })
    setLoading(false)
  }

  return { loading, reload: loadWeekData }
}
