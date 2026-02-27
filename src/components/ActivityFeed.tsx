import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useHouseholdStore } from '../store/household'
import { useDisputes } from '../hooks/useDisputes'
import { springs } from '../lib/animations'
import DisputeBanner from './DisputeBanner'
import DisputeResolver from './DisputeResolver'
import type { TaskLog, DisputeStatus } from '../lib/types'

const STATUS_STYLES: Record<
  DisputeStatus,
  { label: string; color: string; bg: string } | null
> = {
  pending: { label: '⏳', color: 'var(--accent-warning)', bg: 'var(--accent-points-light)' },
  accepted: null,
  disputed: { label: '⚠️', color: 'var(--error)', bg: 'rgba(255,107,107,0.08)' },
  resolved_valid: null,
  resolved_invalid: { label: '✕', color: 'var(--text-muted)', bg: 'transparent' },
}

export default function ActivityFeed() {
  const weekData = useHouseholdStore((s) => s.weekData)
  const profile = useHouseholdStore((s) => s.profile)
  const partner = useHouseholdStore((s) => s.partner)
  const household = useHouseholdStore((s) => s.household)
  const { createDispute, resolveDispute, getDisputeForLog } = useDisputes()

  if (!weekData || !profile || !household) return null

  // Last 10 logs, newest first
  const logs = weekData.taskLogs.slice(0, 10)

  if (logs.length === 0) return null

  function getName(userId: string): string {
    if (userId === profile?.id) return profile?.username ?? 'Tu'
    return partner?.username ?? 'Companero'
  }

  function getColor(userId: string): string {
    const isUser1 = userId === household?.user1_id
    return isUser1 ? 'var(--player-1-dark)' : 'var(--player-2-dark)'
  }

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
        Actividad
      </p>

      {/* Feed items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {logs.map((log: TaskLog, i: number) => {
          const status = STATUS_STYLES[log.dispute_status]
          const isInvalid = log.dispute_status === 'resolved_invalid'
          const isDisputed = log.dispute_status === 'disputed'
          const isPending = log.dispute_status === 'pending'
          const isResolvedValid = log.dispute_status === 'resolved_valid'
          const dispute = isDisputed ? getDisputeForLog(log.id) : undefined

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: i * 0.06 }}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: status?.bg ?? 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-sm)',
                borderLeftWidth: status ? '3px' : '1px',
                borderLeftColor: status?.color ?? 'var(--border-card)',
                opacity: isInvalid ? 0.5 : 1,
              }}
            >
              <div
                className="flex items-center"
                style={{ gap: 'var(--space-3)' }}
              >
                {/* Emoji */}
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                  {log.task_emoji ?? '✅'}
                </span>

                {/* Content */}
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 'var(--text-small)',
                      color: 'var(--text-primary)',
                      textDecoration: isInvalid ? 'line-through' : 'none',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: getColor(log.user_id) }}>
                      {getName(log.user_id)}
                    </span>{' '}
                    {log.task_name}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-tiny)',
                      color: 'var(--text-muted)',
                      marginTop: '1px',
                    }}
                  >
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                    {status?.label ? ` ${status.label}` : ''}
                    {isResolvedValid ? ' ✓' : ''}
                  </p>
                </div>

                {/* Points */}
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-small)',
                    fontWeight: 700,
                    color: isInvalid ? 'var(--text-muted)' : 'var(--accent-points-dark)',
                    textDecoration: isInvalid ? 'line-through' : 'none',
                    flexShrink: 0,
                  }}
                >
                  +{log.points}
                </span>

                {/* Dispute actions */}
                {isPending && (
                  <DisputeBanner
                    log={log}
                    currentUserId={profile.id}
                    onDispute={createDispute}
                  />
                )}

                {isDisputed && dispute && (
                  <DisputeResolver
                    log={log}
                    dispute={dispute}
                    onResolve={resolveDispute}
                  />
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
