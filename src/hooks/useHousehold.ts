import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/household'
import type { Household, Profile, Task } from '../lib/types'

export function useHousehold() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const store = useHouseholdStore()

  useEffect(() => {
    loadHouseholdData()
  }, [])

  async function loadHouseholdData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No autenticado')
        setLoading(false)
        return
      }

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) store.setProfile(profile as Profile)

      // Load household
      const { data: household } = await supabase
        .from('households')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single()

      if (!household) {
        setError('Sin hogar')
        setLoading(false)
        return
      }

      store.setHousehold(household as Household)

      // Load partner profile
      const partnerId = household.user1_id === user.id
        ? household.user2_id
        : household.user1_id

      if (partnerId) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerId)
          .single()

        if (partner) store.setPartner(partner as Profile)
      }

      // Load active tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', household.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (tasks) store.setTasks(tasks as Task[])

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
      setLoading(false)
    }
  }

  return { loading, error, reload: loadHouseholdData }
}
