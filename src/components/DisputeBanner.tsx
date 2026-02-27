import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springs } from '../lib/animations'
import type { TaskLog } from '../lib/types'

interface DisputeBannerProps {
  log: TaskLog
  currentUserId: string
  onDispute: (taskLogId: string, reason?: string) => Promise<void>
}

export default function DisputeBanner({ log, currentUserId, onDispute }: DisputeBannerProps) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Only show if: pending, within deadline, and not the logger
  if (log.dispute_status !== 'pending') return null
  if (log.user_id === currentUserId) return null
  if (log.dispute_deadline) {
    const deadline = new Date(log.dispute_deadline)
    if (Date.now() > deadline.getTime()) return null
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await onDispute(log.id, reason.trim() || undefined)
      setShowModal(false)
      setReason('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          fontSize: 'var(--text-tiny)',
          fontWeight: 600,
          color: 'var(--error)',
          background: 'rgba(255,107,107,0.1)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Disputar
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
              padding: 'var(--space-4)',
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={springs.snappy}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '400px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-lg)',
                paddingBottom: 'max(var(--space-5), env(safe-area-inset-bottom))',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Disputar tarea
              </p>
              <p
                style={{
                  fontSize: 'var(--text-small)',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {log.task_emoji ?? '✅'} {log.task_name} (+{log.points} pts)
              </p>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo (opcional)"
                rows={2}
                style={{
                  width: '100%',
                  fontSize: 'var(--text-body)',
                  fontFamily: 'var(--font-body)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  resize: 'none',
                  outline: 'none',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: 'var(--space-3)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: 'var(--space-3)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    color: 'white',
                    background: 'var(--error)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? 'Enviando...' : 'Enviar disputa'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
