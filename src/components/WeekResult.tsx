import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springs } from '../lib/animations'
import type { WeekResult as WeekResultType, Profile, TaskLog } from '../lib/types'
import { formatPoints } from '../utils/points'

interface WeekResultProps {
  result: WeekResultType
  user1: Profile | null
  user2: Profile | null
  user1Color: string
  user2Color: string
  taskLogs: TaskLog[]
  onDismiss: () => void
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }

    function tick(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick)
      }
    }

    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [target, duration])

  return <>{formatPoints(value)}</>
}

function getTopTasks(logs: TaskLog[], userId: string, limit = 3) {
  const userLogs = logs.filter(
    (l) => l.user_id === userId && l.dispute_status !== 'resolved_invalid'
  )
  // Group by task_name and sum points
  const grouped = new Map<string, { name: string; emoji: string | null; total: number }>()
  for (const log of userLogs) {
    const existing = grouped.get(log.task_name)
    if (existing) {
      existing.total += log.points
    } else {
      grouped.set(log.task_name, { name: log.task_name, emoji: log.task_emoji, total: log.points })
    }
  }
  return Array.from(grouped.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

export default function WeekResult({
  result,
  user1,
  user2,
  user1Color,
  user2Color,
  taskLogs,
  onDismiss,
}: WeekResultProps) {
  const isNoBet = result.no_bet
  const isTie = result.is_tie

  const winnerId = result.winner_id
  const loserId = result.loser_id

  const winnerProfile = winnerId === user1?.id ? user1 : user2
  const loserProfile = loserId === user1?.id ? user1 : user2
  const winnerColor = winnerId === user1?.id ? user1Color : user2Color
  const loserColor = loserId === user1?.id ? user1Color : user2Color
  const winnerPoints = winnerId === user1?.id ? result.user1_points : result.user2_points
  const loserPoints = loserId === user1?.id ? result.user1_points : result.user2_points

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          padding: 'var(--space-5)',
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={springs.bouncy}
          style={{
            width: '100%',
            maxWidth: '380px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          {isNoBet ? (
            <NoBetContent
              user1={user1}
              user2={user2}
              user1Color={user1Color}
              user2Color={user2Color}
              result={result}
            />
          ) : isTie ? (
            <TieContent
              user1={user1}
              user2={user2}
              user1Color={user1Color}
              user2Color={user2Color}
              result={result}
            />
          ) : (
            <WinnerContent
              winnerProfile={winnerProfile}
              loserProfile={loserProfile}
              winnerColor={winnerColor}
              loserColor={loserColor}
              winnerPoints={winnerPoints}
              loserPoints={loserPoints}
              rewardText={result.reward_text}
              taskLogs={taskLogs}
            />
          )}

          {/* Dismiss button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.smooth, delay: 0.6 }}
            onClick={onDismiss}
            style={{
              width: '100%',
              marginTop: 'var(--space-5)',
              padding: 'var(--space-4)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-body)',
              fontWeight: 700,
              color: 'white',
              background: 'var(--text-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            Empezar nueva semana
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// --- Winner variant ---

function WinnerContent({
  winnerProfile,
  loserProfile,
  winnerColor,
  loserColor,
  winnerPoints,
  loserPoints,
  rewardText,
  taskLogs,
}: {
  winnerProfile: Profile | null
  loserProfile: Profile | null
  winnerColor: string
  loserColor: string
  winnerPoints: number
  loserPoints: number
  rewardText: string | null
  taskLogs: TaskLog[]
}) {
  const winnerTasks = winnerProfile ? getTopTasks(taskLogs, winnerProfile.id) : []
  const loserTasks = loserProfile ? getTopTasks(taskLogs, loserProfile.id) : []

  return (
    <>
      {/* Crown emoji */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.bouncy}
        style={{ fontSize: '3.5rem', marginBottom: 'var(--space-2)' }}
      >
        👑
      </motion.div>

      {/* Winner */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.15 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h2)',
          fontWeight: 800,
          color: winnerColor,
        }}
      >
        {winnerProfile?.username ?? 'Ganador'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--accent-points-dark)',
          marginTop: 'var(--space-1)',
        }}
      >
        <CountUp target={winnerPoints} /> pts
      </motion.p>

      {/* Separator */}
      <div
        style={{
          height: '1px',
          background: 'var(--border-card)',
          margin: 'var(--space-4) 0',
        }}
      />

      {/* Loser */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <p
          style={{
            fontSize: 'var(--text-body)',
            color: loserColor,
            fontWeight: 600,
          }}
        >
          😅 {loserProfile?.username ?? 'Segundo'}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h3)',
            fontWeight: 700,
            color: 'var(--text-muted)',
          }}
        >
          <CountUp target={loserPoints} /> pts
        </p>
      </motion.div>

      {/* Reward */}
      {rewardText && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--text-primary)',
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          🍽️ {loserProfile?.username ?? 'Perdedor'} {rewardText}
        </motion.p>
      )}

      {/* Top tasks */}
      <div style={{ marginTop: 'var(--space-4)' }}>
        <TopTasksList
          label={winnerProfile?.username ?? 'Ganador'}
          color={winnerColor}
          tasks={winnerTasks}
          baseDelay={0.5}
        />
        <TopTasksList
          label={loserProfile?.username ?? 'Segundo'}
          color={loserColor}
          tasks={loserTasks}
          baseDelay={0.5 + winnerTasks.length * 0.08}
        />
      </div>
    </>
  )
}

// --- Tie variant ---

function TieContent({
  user1,
  user2,
  user1Color,
  user2Color,
  result,
}: {
  user1: Profile | null
  user2: Profile | null
  user1Color: string
  user2Color: string
  result: WeekResultType
}) {
  const total = result.user1_points + result.user2_points
  const diffPct = total > 0
    ? ((Math.abs(result.user1_points - result.user2_points) / total) * 100).toFixed(1)
    : '0'

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.bouncy}
        style={{ fontSize: '3.5rem', marginBottom: 'var(--space-2)' }}
      >
        🤝
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h3)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        Empate
      </motion.p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-6)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springs.smooth, delay: 0.25 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontWeight: 700, color: user1Color, fontSize: 'var(--text-body)' }}>
            {user1?.username ?? 'Jugador 1'}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h3)',
              fontWeight: 700,
              color: 'var(--accent-points-dark)',
            }}
          >
            <CountUp target={result.user1_points} /> pts
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springs.smooth, delay: 0.25 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontWeight: 700, color: user2Color, fontSize: 'var(--text-body)' }}>
            {user2?.username ?? 'Jugador 2'}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h3)',
              fontWeight: 700,
              color: 'var(--accent-points-dark)',
            }}
          >
            <CountUp target={result.user2_points} /> pts
          </p>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          fontSize: 'var(--text-small)',
          color: 'var(--text-muted)',
          marginTop: 'var(--space-3)',
        }}
      >
        Diferencia: {diffPct}% — Nadie pierde esta semana
      </motion.p>
    </>
  )
}

// --- No-bet variant ---

function NoBetContent({
  user1,
  user2,
  user1Color,
  user2Color,
  result,
}: {
  user1: Profile | null
  user2: Profile | null
  user1Color: string
  user2Color: string
  result: WeekResultType
}) {
  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.bouncy}
        style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}
      >
        📊
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h3)',
          fontWeight: 700,
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-4)',
        }}
      >
        Semana sin apuesta
      </motion.p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-6)',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontWeight: 600, color: user1Color, fontSize: 'var(--text-small)' }}>
            {user1?.username ?? 'Jugador 1'}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h3)',
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}
          >
            <CountUp target={result.user1_points} /> pts
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontWeight: 600, color: user2Color, fontSize: 'var(--text-small)' }}>
            {user2?.username ?? 'Jugador 2'}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h3)',
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}
          >
            <CountUp target={result.user2_points} /> pts
          </p>
        </motion.div>
      </div>
    </>
  )
}

// --- Top tasks list ---

function TopTasksList({
  label,
  color,
  tasks,
  baseDelay,
}: {
  label: string
  color: string
  tasks: { name: string; emoji: string | null; total: number }[]
  baseDelay: number
}) {
  if (tasks.length === 0) return null

  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <p
        style={{
          fontSize: 'var(--text-tiny)',
          fontWeight: 600,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 'var(--space-1)',
          textAlign: 'left',
        }}
      >
        Top {label}
      </p>
      {tasks.map((t, i) => (
        <motion.div
          key={t.name}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springs.gentle, delay: baseDelay + i * 0.08 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--text-small)',
            color: 'var(--text-secondary)',
            padding: '2px 0',
          }}
        >
          <span>
            {t.emoji ?? '✅'} {t.name}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--accent-points-dark)',
            }}
          >
            {t.total}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
