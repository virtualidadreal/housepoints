import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, Household } from '../lib/types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  household: Household | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    household: null,
    loading: true,
  })
  const navigate = useNavigate()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState((s) => ({ ...s, user: session.user, session }))
        loadUserData(session.user.id)
      } else {
        setState((s) => ({ ...s, loading: false }))
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState((s) => ({ ...s, user: session.user, session }))
        loadUserData(session.user.id)
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          household: null,
          loading: false,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserData(userId: string) {
    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Load household (user can be user1 or user2)
    const { data: household } = await supabase
      .from('households')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    setState((s) => ({
      ...s,
      profile: profile as Profile | null,
      household: household as Household | null,
      loading: false,
    }))
  }

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })
    if (error) throw error

    // Create profile row
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        username,
      })
      if (profileError) throw profileError
    }

    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    navigate('/login')
  }

  function getRedirectPath(): string {
    if (!state.user) return '/login'
    if (!state.household) return '/onboarding'
    return '/home'
  }

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    getRedirectPath,
  }
}
