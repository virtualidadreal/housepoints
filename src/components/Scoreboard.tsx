import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useHouseholdStore } from '../store/household'
import { getTimeUntilClose } from '../utils/week'
import { formatPoints, determineWinner } from '../utils/points'
import { springs } from '../lib/animations'

export default function Scoreboard() {
  const household = useHouseholdStore((s) => s.household)
  const profile = useHouseholdStore((s) => s.profile)
  const partner = useHouseholdStore((s) => s.partner)
  const weekData = useHouseholdStore((s) => s.weekData)
  const [countdown, setCountdown] = useState('')

  // Determine which user is "me" and which is "them"
  const isUser1 = profile?.id === household?.user1_id
  const myPoints = isUser1 ? (weekData?.user1Points ?? 0) : (weekData?.user2Points ?? 0)
  const theirPoints = isUser1 ? (weekData?.user2Points ?? 0) : (weekData?.user1Points ?? 0)
  const myColor = isUser1 ? 'var(--player-1)' : 'var(--player-2)'
  const myColorLight = isUser1 ? 'var(--player-1-light)' : 'var(--player-2-light)'
  const myColorDark = isUser1 ? 'var(--player-1-dark)' : 'var(--player-2-dark)'
  const theirColorLight = isUser1 ? 'var(--player-2-light)' : 'var(--player-1-light)'
  const theirColorDark = isUser1 ? 'var(--player-2-dark)' : 'var(--player-1-dark)'

  const total = myPoints + theirPoints
  const myPercentage = total > 0 ? (myPoints / total) * 100 : 50

  const winner = household
    ? determineWinner(
        isUser1 ? myPoints : theirPoints,
        isUser1 ? theirPoints : myPoints,
        household.tie_threshold
      )
    : 'tie'

  const iAmWinning =
    (isUser1 && winner === 'user1') || (!isUser1 && winner === 'user2')
  const theyAreWinning =
    (isUser1 && winner === 'user2') || (!isUser1 && winner === 'user1')

  // Countdown timer
  useEffect(() => {
    if (!household) return

    function updateCountdown() {
      if (!household) return
      const ms = getTimeUntilClose(household)
      if (ms <= 0) {
        setCountdown('Semana cerrada')
        return
      }
      const days = Math.floor(ms / (1000 * 60 * 60 * 24))
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setCountdown(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`)
      } else {
        setCountdown(`${minutes}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [household])

  if (!household || !profile) return null

  const statusText = (() => {
    if (winner === 'tie') return 'Empate tecnico'
    const diff = Math.abs(myPoints - theirPoints)
    if (iAmWinning) return `Vas ganando (+${formatPoints(diff)})`
    if (theyAreWinning) return `${partner?.username ?? 'Rival'} va ganando (+${formatPoints(diff)})`
    return ''
  })()

  const CLOSE_DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Player scores */}
      <div className="flex items-center justify-between" style={{ gap: 'var(--space-3)' }}>
        {/* Me */}
        <div className="flex-1 text-center">
          <div
            style={{
              background: myColorLight,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-2)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--text-small)',
                fontWeight: 600,
                color: myColorDark,
                marginBottom: '2px',
              }}
            >
              {profile.username ?? 'Tu'}
            </p>
            <motion.p
              key={myPoints}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={springs.smooth}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-score)',
                fontWeight: 700,
                color: myColorDark,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatPoints(myPoints)}
            </motion.p>
          </div>
        </div>

        {/* VS */}
        <span
          style={{
            fontSize: 'var(--text-tiny)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            flexShrink: 0,
          }}
        >
          vs
        </span>

        {/* Them */}
        <div className="flex-1 text-center">
          <div
            style={{
              background: theirColorLight,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-2)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--text-small)',
                fontWeight: 600,
                color: theirColorDark,
                marginBottom: '2px',
              }}
            >
              {partner?.username ?? 'Esperando...'}
            </p>
            <motion.p
              key={theirPoints}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={springs.smooth}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-score)',
                fontWeight: 700,
                color: theirColorDark,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatPoints(theirPoints)}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '8px',
          borderRadius: 'var(--radius-full)',
          background: theirColorLight,
          marginTop: 'var(--space-4)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={false}
          animate={{ width: `${myPercentage}%` }}
          transition={springs.smooth}
          style={{
            height: '100%',
            borderRadius: 'var(--radius-full)',
            background: myColor,
            minWidth: total > 0 ? '4px' : '50%',
          }}
        />
      </div>

      {/* Status line */}
      <div
        className="flex items-center justify-between"
        style={{ marginTop: 'var(--space-2)' }}
      >
        <p style={{ fontSize: 'var(--text-tiny)', color: 'var(--text-muted)' }}>
          {statusText}
        </p>
        <p style={{ fontSize: 'var(--text-tiny)', color: 'var(--text-muted)' }}>
          Cierra {CLOSE_DAYS[household.week_close_day]} · {countdown}
        </p>
      </div>
    </div>
  )
}
