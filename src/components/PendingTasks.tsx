import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { usePendingTasks } from '../hooks/usePendingTasks'
import { springs } from '../lib/animations'

const URGENCY_COLORS = {
  low: { bg: 'var(--accent-info)', text: 'var(--accent-info)' },
  medium: { bg: 'var(--accent-warning)', text: 'var(--accent-warning)' },
  high: { bg: 'var(--error)', text: 'var(--error)' },
}

export default function PendingTasks() {
  const pending = usePendingTasks()

  if (pending.length === 0) return null

  return (
    <div>
      {/* Section title */}
      <div className="flex items-center" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <Clock size={14} color="var(--accent-warning)" />
        <p
          style={{
            fontSize: 'var(--text-tiny)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Toca hacer
        </p>
      </div>

      {/* Pending list */}
      <div className="flex flex-wrap" style={{ gap: 'var(--space-2)' }}>
        {pending.slice(0, 5).map((item, i) => {
          const colors = URGENCY_COLORS[item.urgency]
          return (
            <motion.div
              key={item.task.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.gentle, delay: i * 0.05 }}
              className="flex items-center"
              style={{
                gap: 'var(--space-2)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderLeftWidth: '3px',
                borderLeftColor: colors.bg,
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>
                {item.task.emoji ?? '📌'}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-tiny)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                {item.task.name}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-tiny)',
                  fontWeight: 600,
                  color: colors.text,
                }}
              >
                · {item.daysSinceLastDone}d
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
