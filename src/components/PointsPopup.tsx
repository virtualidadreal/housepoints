import { motion, AnimatePresence } from 'framer-motion'
import { springs } from '../lib/animations'

interface PointsPopupProps {
  points: number | null
  onComplete: () => void
}

export default function PointsPopup({ points, onComplete }: PointsPopupProps) {
  return (
    <AnimatePresence>
      {points !== null && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -40, scale: 1 }}
          exit={{ opacity: 0, y: -70, scale: 0.8 }}
          transition={springs.bouncy}
          onAnimationComplete={onComplete}
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-points-popup)',
            fontWeight: 800,
            color: 'var(--accent-points-dark)',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          +{points}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
