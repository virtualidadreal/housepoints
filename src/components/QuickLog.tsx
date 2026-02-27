import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/household'
import { getCurrentWeekId } from '../utils/week'
import { springs } from '../lib/animations'
import PointsPopup from './PointsPopup'
import type { Task, TaskLog } from '../lib/types'

const INITIAL_VISIBLE = 8

export default function QuickLog() {
  const household = useHouseholdStore((s) => s.household)
  const profile = useHouseholdStore((s) => s.profile)
  const tasks = useHouseholdStore((s) => s.tasks)
  const addTaskLog = useHouseholdStore((s) => s.addTaskLog)

  const [showAll, setShowAll] = useState(false)
  const [tappedId, setTappedId] = useState<string | null>(null)
  const [popupData, setPopupData] = useState<{ taskId: string; points: number } | null>(null)

  const visibleTasks = showAll ? tasks : tasks.slice(0, INITIAL_VISIBLE)
  const hasMore = tasks.length > INITIAL_VISIBLE

  const logTask = useCallback(
    async (task: Task) => {
      if (!household || !profile || tappedId) return

      setTappedId(task.id)
      setPopupData({ taskId: task.id, points: task.points })

      const weekId = getCurrentWeekId(household)
      const now = new Date()
      const deadline = new Date(now.getTime() + 2 * 60 * 60 * 1000) // +2h

      const { data, error } = await supabase
        .from('task_logs')
        .insert({
          household_id: household.id,
          user_id: profile.id,
          task_id: task.id,
          task_name: task.name,
          task_emoji: task.emoji,
          points: task.points,
          week_id: weekId,
          dispute_status: 'pending',
          dispute_deadline: deadline.toISOString(),
        })
        .select()
        .single()

      if (!error && data) {
        addTaskLog(data as TaskLog)
      }

      // Reset tap state after a short delay
      setTimeout(() => setTappedId(null), 300)
    },
    [household, profile, tappedId, addTaskLog]
  )

  if (!household || tasks.length === 0) return null

  return (
    <div>
      {/* Section title */}
      <p
        style={{
          fontSize: 'var(--text-tiny)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--space-3)',
        }}
      >
        Registrar tarea
      </p>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
        }}
      >
        {visibleTasks.map((task, i) => (
          <motion.button
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: i * 0.03 }}
            onClick={() => logTask(task)}
            disabled={tappedId === task.id}
            whileTap={{ scale: 0.93 }}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              minHeight: '76px',
              padding: '12px 4px',
              background:
                tappedId === task.id
                  ? 'var(--accent-points-light)'
                  : 'var(--bg-card)',
              border: `2px solid ${
                tappedId === task.id
                  ? 'var(--accent-points)'
                  : 'var(--border-card)'
              }`,
              borderRadius: '16px',
              boxShadow: tappedId === task.id ? 'none' : 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
              fontFamily: 'var(--font-body)',
              overflow: 'visible',
            }}
          >
            {/* Points popup */}
            {popupData?.taskId === task.id && (
              <PointsPopup
                points={popupData.points}
                onComplete={() => setPopupData(null)}
              />
            )}

            {/* Emoji */}
            <span style={{ fontSize: '1.625rem', lineHeight: 1 }}>
              {task.emoji ?? '✅'}
            </span>

            {/* Points */}
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--accent-points-dark)',
              }}
            >
              {task.points}
            </span>
          </motion.button>
        ))}

        {/* More button */}
        {hasMore && !showAll && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAll(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              minHeight: '76px',
              padding: '12px 4px',
              background: 'var(--bg-elevated)',
              border: '2px dashed var(--border-card)',
              borderRadius: '16px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Plus size={22} color="var(--text-muted)" />
            <span
              style={{
                fontSize: 'var(--text-tiny)',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              mas
            </span>
          </motion.button>
        )}
      </div>
    </div>
  )
}
