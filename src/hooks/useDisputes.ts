import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/household'
import type { Dispute } from '../lib/types'

export function useDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const household = useHouseholdStore((s) => s.household)
  const weekData = useHouseholdStore((s) => s.weekData)

  const loadDisputes = useCallback(async () => {
    if (!household || !weekData) return

    const logIds = weekData.taskLogs.map((l) => l.id)
    if (logIds.length === 0) {
      setDisputes([])
      setPendingCount(0)
      return
    }

    const { data } = await supabase
      .from('disputes')
      .select('*')
      .in('task_log_id', logIds)
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    const rows = (data ?? []) as Dispute[]
    setDisputes(rows)
    setPendingCount(rows.length)
  }, [household?.id, weekData?.taskLogs.length])

  useEffect(() => {
    loadDisputes()
  }, [loadDisputes])

  // Realtime subscription for disputes
  useEffect(() => {
    if (!household) return

    const channel = supabase
      .channel(`disputes_${household.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'disputes',
        },
        () => {
          // Reload on any change
          loadDisputes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [household?.id, loadDisputes])

  async function createDispute(taskLogId: string, reason?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Insert dispute
    const { error: insertError } = await supabase.from('disputes').insert({
      task_log_id: taskLogId,
      disputed_by: user.id,
      reason: reason ?? null,
    })
    if (insertError) throw insertError

    // Update task_log dispute_status
    const { error: updateError } = await supabase
      .from('task_logs')
      .update({ dispute_status: 'disputed' })
      .eq('id', taskLogId)
    if (updateError) throw updateError

    await loadDisputes()
  }

  async function resolveDispute(
    disputeId: string,
    taskLogId: string,
    resolution: 'valid' | 'invalid'
  ) {
    const { error: disputeError } = await supabase
      .from('disputes')
      .update({
        resolved: true,
        resolution,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId)
    if (disputeError) throw disputeError

    const status = resolution === 'valid' ? 'resolved_valid' : 'resolved_invalid'
    const { error: logError } = await supabase
      .from('task_logs')
      .update({ dispute_status: status })
      .eq('id', taskLogId)
    if (logError) throw logError

    await loadDisputes()
  }

  function getDisputeForLog(taskLogId: string): Dispute | undefined {
    return disputes.find((d) => d.task_log_id === taskLogId)
  }

  return {
    disputes,
    pendingCount,
    createDispute,
    resolveDispute,
    getDisputeForLog,
    reload: loadDisputes,
  }
}
