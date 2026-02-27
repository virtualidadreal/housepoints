import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const PUBLIC_ROUTES = ['/login', '/register']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname)

    if (!session && !isPublicRoute) {
      navigate('/login', { replace: true })
    }

    if (session && isPublicRoute) {
      // Check if user has a household to decide redirect
      checkHouseholdAndRedirect(session.user.id)
    }
  }, [session, loading, location.pathname, navigate])

  async function checkHouseholdAndRedirect(userId: string) {
    const { data: household } = await supabase
      .from('households')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    if (household) {
      navigate('/home', { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  }

  if (loading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--border-card)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return <>{children}</>
}
