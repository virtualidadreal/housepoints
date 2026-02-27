import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useHousehold } from '../hooks/useHousehold'
import { useWeekData } from '../hooks/useWeekData'
import { useRealtime } from '../hooks/useRealtime'
import { useHouseholdStore } from '../store/household'
import { getCurrentWeekId, getTimeUntilClose } from '../utils/week'
import Scoreboard from '../components/Scoreboard'
import QuickLog from '../components/QuickLog'
import PendingTasks from '../components/PendingTasks'
import ActivityFeed from '../components/ActivityFeed'
import WeekResultOverlay from '../components/WeekResult'
import type { WeekResult } from '../lib/types'

export default function Home() {
  const navigate = useNavigate()
  const { loading: householdLoading, error } = useHousehold()
  const { loading: weekLoading, reload: reloadWeek } = useWeekData()
  useRealtime()

  const household = useHouseholdStore((s) => s.household)
  const profile = useHouseholdStore((s) => s.profile)
  const partner = useHouseholdStore((s) => s.partner)
  const weekData = useHouseholdStore((s) => s.weekData)

  const [weekResult, setWeekResult] = useState<WeekResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  // Check for week close + unseen results
  const checkWeekStatus = useCallback(async () => {
    if (!household) return

    const weekId = getCurrentWeekId(household)
    const timeUntilClose = getTimeUntilClose(household)

    // If week has closed, try to close it server-side
    if (timeUntilClose < 0) {
      // Check if result already exists
      const { data: existing } = await supabase
        .from('week_results')
        .select('*')
        .eq('household_id', household.id)
        .eq('week_id', weekId)
        .maybeSingle()

      if (!existing) {
        // Attempt client-side close fallback
        await supabase.rpc('close_week_for_household', {
          h_id: household.id,
          w_id: weekId,
        })
        reloadWeek()
      }
    }

    // Check for unseen week results (any week)
    const { data: results } = await supabase
      .from('week_results')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (results && results.length > 0) {
      const latest = results[0] as WeekResult
      const seenKey = `seen_week_result_${latest.week_id}`
      if (!localStorage.getItem(seenKey)) {
        setWeekResult(latest)
        setShowResult(true)
      }
    }
  }, [household, reloadWeek])

  useEffect(() => {
    if (!householdLoading && !weekLoading && household) {
      checkWeekStatus()
    }
  }, [householdLoading, weekLoading, household, checkWeekStatus])

  function handleDismissResult() {
    if (weekResult) {
      localStorage.setItem(`seen_week_result_${weekResult.week_id}`, '1')
    }
    setShowResult(false)
    setWeekResult(null)
    reloadWeek()
  }

  if (householdLoading || weekLoading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--border-card)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error || !household) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
          {error ?? 'No se encontro el hogar'}
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: 'var(--bg-primary)',
        paddingBottom: 'var(--space-8)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: 'var(--space-4) var(--space-5)',
          paddingTop: 'max(var(--space-4), env(safe-area-inset-top))',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h2)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {household.name ?? 'HousePoints'}
        </h1>
        <button
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          aria-label="Ajustes"
        >
          <Settings size={22} />
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '0 var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        {/* Scoreboard */}
        <Scoreboard />

        {/* Pending Tasks (only if there are overdue) */}
        <PendingTasks />

        {/* QuickLog grid */}
        <QuickLog />

        {/* Activity Feed */}
        <ActivityFeed />
      </div>

      {/* Week Result Overlay */}
      {showResult && weekResult && (
        <WeekResultOverlay
          result={weekResult}
          user1={profile}
          user2={partner}
          user1Color="var(--player-1-dark)"
          user2Color="var(--player-2-dark)"
          taskLogs={weekData?.taskLogs ?? []}
          onDismiss={handleDismissResult}
        />
      )}
    </div>
  )
}
