import { useState } from 'react'
import type { Dispute, TaskLog } from '../lib/types'

interface DisputeResolverProps {
  log: TaskLog
  dispute: Dispute
  onResolve: (disputeId: string, taskLogId: string, resolution: 'valid' | 'invalid') => Promise<void>
}

export default function DisputeResolver({ log, dispute, onResolve }: DisputeResolverProps) {
  const [resolving, setResolving] = useState(false)

  async function handleResolve(resolution: 'valid' | 'invalid') {
    setResolving(true)
    try {
      await onResolve(dispute.id, log.id, resolution)
    } finally {
      setResolving(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => handleResolve('valid')}
        disabled={resolving}
        style={{
          fontSize: 'var(--text-tiny)',
          fontWeight: 700,
          color: 'var(--success)',
          background: 'rgba(107,203,119,0.12)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 8px',
          cursor: resolving ? 'not-allowed' : 'pointer',
          opacity: resolving ? 0.5 : 1,
        }}
      >
        ✓ Valido
      </button>
      <button
        onClick={() => handleResolve('invalid')}
        disabled={resolving}
        style={{
          fontSize: 'var(--text-tiny)',
          fontWeight: 700,
          color: 'var(--error)',
          background: 'rgba(255,107,107,0.12)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 8px',
          cursor: resolving ? 'not-allowed' : 'pointer',
          opacity: resolving ? 0.5 : 1,
        }}
      >
        ✗ Invalido
      </button>
    </div>
  )
}
