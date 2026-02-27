import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Users,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Minus,
  Plus,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateInviteCode } from '../utils/invite'
import { springs } from '../lib/animations'
import type { Task } from '../lib/types'

// Avatar color options
const AVATAR_COLORS = [
  { name: 'Verde menta', hex: '#6BCB77' },
  { name: 'Rosa coral', hex: '#FF6B8A' },
  { name: 'Azul cielo', hex: '#7EB6FF' },
  { name: 'Amarillo sol', hex: '#FFD93D' },
  { name: 'Lavanda', hex: '#B197FC' },
  { name: 'Naranja', hex: '#FFB347' },
]

// Days of the week (for close day selector)
const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 0, label: 'Domingo' },
]

// Generate hour options in 15-min intervals
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      options.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

// Default tasks matching the seed function
const DEFAULT_TASKS: Omit<Task, 'id' | 'household_id' | 'created_at'>[] = [
  { name: 'Hacer la cama', emoji: '🛌', points: 20, category: 'orden', frequency: 'daily', is_bonus: false, is_active: true, sort_order: 1 },
  { name: 'Sacar la basura', emoji: '🗑️', points: 50, category: 'limpieza', frequency: 'daily', is_bonus: false, is_active: true, sort_order: 2 },
  { name: 'Fregar los platos', emoji: '🍽️', points: 50, category: 'limpieza', frequency: 'daily', is_bonus: false, is_active: true, sort_order: 3 },
  { name: 'Preparar desayuno', emoji: '☕', points: 50, category: 'cocina', frequency: 'daily', is_bonus: false, is_active: true, sort_order: 4 },
  { name: 'Recoger el salon', emoji: '🛋️', points: 50, category: 'orden', frequency: 'daily', is_bonus: false, is_active: true, sort_order: 5 },
  { name: 'Recoger la habitacion', emoji: '🛏️', points: 50, category: 'orden', frequency: 'daily', is_bonus: false, is_active: true, sort_order: 6 },
  { name: 'Poner lavadora', emoji: '👕', points: 50, category: 'ropa', frequency: 'weekly', is_bonus: false, is_active: true, sort_order: 7 },
  { name: 'Tender la ropa', emoji: '🪢', points: 50, category: 'ropa', frequency: 'weekly', is_bonus: false, is_active: true, sort_order: 8 },
  { name: 'Barrer / Fregar el suelo', emoji: '🧹', points: 100, category: 'limpieza', frequency: 'weekly', is_bonus: false, is_active: true, sort_order: 9 },
  { name: 'Pasar la aspiradora', emoji: '🌀', points: 100, category: 'limpieza', frequency: 'weekly', is_bonus: false, is_active: true, sort_order: 10 },
  { name: 'Recoger y doblar la ropa', emoji: '📦', points: 100, category: 'ropa', frequency: 'weekly', is_bonus: false, is_active: true, sort_order: 11 },
  { name: 'Cocinar', emoji: '👨‍🍳', points: 200, category: 'cocina', frequency: 'daily', is_bonus: false, is_active: true, sort_order: 12 },
  { name: 'Limpiar la cocina', emoji: '🫧', points: 200, category: 'limpieza', frequency: 'weekly', is_bonus: false, is_active: true, sort_order: 13 },
  { name: 'Hacer la compra', emoji: '🛒', points: 250, category: 'compras', frequency: 'weekly', is_bonus: false, is_active: true, sort_order: 14 },
  { name: 'Planchar', emoji: '♨️', points: 250, category: 'ropa', frequency: 'monthly', is_bonus: false, is_active: true, sort_order: 15 },
  { name: 'Limpiar el bano', emoji: '🚿', points: 250, category: 'limpieza', frequency: 'weekly', is_bonus: false, is_active: true, sort_order: 16 },
  { name: 'Limpiar nevera', emoji: '🧊', points: 250, category: 'bonus', frequency: 'monthly', is_bonus: true, is_active: true, sort_order: 17 },
  { name: 'Organizar armario', emoji: '👗', points: 250, category: 'bonus', frequency: 'asneeded', is_bonus: true, is_active: true, sort_order: 18 },
  { name: 'Arreglo / Reparacion', emoji: '🔧', points: 500, category: 'bonus', frequency: 'asneeded', is_bonus: true, is_active: true, sort_order: 19 },
  { name: 'Compra grande mensual', emoji: '🏪', points: 500, category: 'bonus', frequency: 'monthly', is_bonus: true, is_active: true, sort_order: 20 },
]

type Step = 'choice' | 'create' | 'join' | 'setup' | 'avatar' | 'tasks'

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('choice')
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back

  // Create flow state
  const [inviteCode, setInviteCode] = useState('')
  const [householdId, setHouseholdId] = useState('')
  const [copied, setCopied] = useState(false)
  const [waitingForPartner, setWaitingForPartner] = useState(false)

  // Join flow state
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  // Setup state
  const [householdName, setHouseholdName] = useState('')
  const [closeDay, setCloseDay] = useState(0) // Sunday
  const [closeTime, setCloseTime] = useState('23:59')
  const [competitiveMode, setCompetitiveMode] = useState(true)
  const [rewardText, setRewardText] = useState('paga la cena')
  const [tieThreshold, setTieThreshold] = useState(5)
  const [avatarColor, setAvatarColor] = useState('#6BCB77')

  // Tasks state
  const [tasks, setTasks] = useState(DEFAULT_TASKS)

  // Loading states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Navigate between steps
  const goTo = useCallback((newStep: Step, dir: number = 1) => {
    setDirection(dir)
    setError('')
    setStep(newStep)
  }, [])

  // --- CREATE HOUSEHOLD ---
  const handleCreateHousehold = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const code = generateInviteCode()
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

      const { data, error: insertError } = await supabase
        .from('households')
        .insert({
          user1_id: user.id,
          invite_code: code,
          invite_expires_at: expiresAt,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setInviteCode(code)
      setHouseholdId(data.id)
      setWaitingForPartner(true)
      goTo('create')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear hogar')
    } finally {
      setLoading(false)
    }
  }

  // --- COPY INVITE CODE ---
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers that don't support clipboard API
      const el = document.createElement('textarea')
      el.value = inviteCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // --- POLL FOR PARTNER (when creator is waiting) ---
  useEffect(() => {
    if (!waitingForPartner || !householdId) return

    const channel = supabase
      .channel(`household-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'households',
          filter: `id=eq.${householdId}`,
        },
        (payload) => {
          const updated = payload.new as { user2_id: string | null }
          if (updated.user2_id) {
            setWaitingForPartner(false)
            goTo('setup')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [waitingForPartner, householdId, goTo])

  // --- JOIN HOUSEHOLD ---
  const handleJoinHousehold = async () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) {
      setJoinError('El codigo debe tener 6 caracteres')
      return
    }

    setLoading(true)
    setJoinError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Find household with this code
      const { data: household, error: findError } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', code)
        .single()

      if (findError || !household) {
        setJoinError('Codigo no encontrado')
        return
      }

      if (household.user2_id) {
        setJoinError('Este codigo ya ha sido usado')
        return
      }

      if (household.invite_expires_at && new Date(household.invite_expires_at) < new Date()) {
        setJoinError('Este codigo ha expirado')
        return
      }

      if (household.user1_id === user.id) {
        setJoinError('No puedes unirte a tu propio hogar')
        return
      }

      // Join household
      const { error: updateError } = await supabase
        .from('households')
        .update({
          user2_id: user.id,
          invite_code: null, // Invalidate code
        })
        .eq('id', household.id)

      if (updateError) throw updateError

      // Update avatar color for user2
      await supabase
        .from('profiles')
        .update({ avatar_color: '#FF6B8A' }) // Default pink for user2
        .eq('id', user.id)

      setHouseholdId(household.id)
      goTo('setup')
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'Error al unirse')
    } finally {
      setLoading(false)
    }
  }

  // --- SAVE SETUP ---
  const handleSaveSetup = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const [hourStr, minuteStr] = closeTime.split(':')

      const { error: updateError } = await supabase
        .from('households')
        .update({
          name: householdName || null,
          week_close_day: closeDay,
          week_close_hour: parseInt(hourStr, 10),
          week_close_minute: parseInt(minuteStr, 10),
          competitive_mode: competitiveMode,
          reward_text: rewardText || 'paga la cena',
          tie_threshold: tieThreshold,
        })
        .eq('id', householdId)

      if (updateError) throw updateError

      goTo('avatar')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuracion')
    } finally {
      setLoading(false)
    }
  }

  // --- SAVE AVATAR COLOR ---
  const handleSaveAvatar = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      await supabase
        .from('profiles')
        .update({ avatar_color: avatarColor })
        .eq('id', user.id)

      goTo('tasks')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar color')
    } finally {
      setLoading(false)
    }
  }

  // --- SAVE TASKS & FINISH ---
  const handleFinish = async () => {
    setLoading(true)
    setError('')
    try {
      // Seed default tasks via RPC
      const { error: rpcError } = await supabase.rpc('seed_default_tasks', {
        h_id: householdId,
      })
      if (rpcError) throw rpcError

      // Deactivate tasks the user toggled off
      const disabledTasks = tasks.filter((t) => !t.is_active)
      if (disabledTasks.length > 0) {
        const disabledNames = disabledTasks.map((t) => t.name)
        await supabase
          .from('tasks')
          .update({ is_active: false })
          .eq('household_id', householdId)
          .in('name', disabledNames)
      }

      // Update points for tasks where user adjusted them
      const modifiedTasks = tasks.filter((t, i) => t.is_active && t.points !== DEFAULT_TASKS[i].points)
      for (const task of modifiedTasks) {
        await supabase
          .from('tasks')
          .update({ points: task.points })
          .eq('household_id', householdId)
          .eq('name', task.name)
      }

      navigate('/home')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar tareas')
    } finally {
      setLoading(false)
    }
  }

  // --- UPDATE TASK POINTS ---
  const updateTaskPoints = (index: number, delta: number) => {
    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t
        const newPoints = Math.max(10, t.points + delta)
        return { ...t, points: newPoints }
      })
    )
  }

  // --- TOGGLE TASK ACTIVE ---
  const toggleTask = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, is_active: !t.is_active } : t))
    )
  }

  // --- ANIMATION VARIANTS ---
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Progress indicator */}
      <div className="mx-auto mb-8 flex w-full max-w-sm gap-2">
        {['choice', 'create/join', 'setup', 'avatar', 'tasks'].map((s, i) => {
          const stepIndex =
            step === 'choice' ? 0
            : step === 'create' || step === 'join' ? 1
            : step === 'setup' ? 2
            : step === 'avatar' ? 3
            : 4
          return (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: i <= stepIndex ? 'var(--player-1)' : 'var(--border-subtle)',
              }}
            />
          )
        })}
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-4 flex w-full max-w-sm items-center gap-2 rounded-xl px-4 py-3"
          style={{ backgroundColor: '#FFF0F0', color: 'var(--error)' }}
        >
          <AlertCircle size={18} />
          <span style={{ fontSize: 'var(--text-small)' }}>{error}</span>
        </motion.div>
      )}

      {/* Steps */}
      <div className="relative mx-auto w-full max-w-sm flex-1">
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 1: Choice */}
          {step === 'choice' && (
            <motion.div
              key="choice"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springs.snappy}
              className="flex flex-col items-center"
            >
              <div className="mb-2 text-4xl">🏠</div>
              <h1
                className="mb-2 font-bold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
              >
                Tu hogar
              </h1>
              <p
                className="mb-8 text-center"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}
              >
                Crea un nuevo hogar o unete al de tu pareja con un codigo
              </p>

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={handleCreateHousehold}
                  disabled={loading}
                  className="flex w-full items-center justify-between px-5 py-4"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '2px solid var(--border-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'var(--player-1-light)' }}
                    >
                      <Home size={20} style={{ color: 'var(--player-1)' }} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold" style={{ fontSize: 'var(--text-body)' }}>
                        Crear hogar
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>
                        Genera un codigo para tu pareja
                      </div>
                    </div>
                  </div>
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>

                <button
                  onClick={() => goTo('join')}
                  disabled={loading}
                  className="flex w-full items-center justify-between px-5 py-4"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '2px solid var(--border-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'var(--player-2-light)' }}
                    >
                      <Users size={20} style={{ color: 'var(--player-2)' }} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold" style={{ fontSize: 'var(--text-body)' }}>
                        Unirse con codigo
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>
                        Tu pareja ya creo el hogar
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2A: Create - Show invite code */}
          {step === 'create' && (
            <motion.div
              key="create"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springs.snappy}
              className="flex flex-col items-center"
            >
              <div className="mb-2 text-4xl">🔑</div>
              <h1
                className="mb-2 font-bold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
              >
                Codigo de invitacion
              </h1>
              <p
                className="mb-6 text-center"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}
              >
                Comparte este codigo con tu pareja para que se una
              </p>

              {/* Code display */}
              <div
                className="mb-3 flex w-full items-center justify-center gap-2 px-6 py-5"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '2px solid var(--border-card)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <span
                  className="font-bold tracking-[0.3em]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {inviteCode}
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                className="mb-6 flex items-center gap-2 px-4 py-2"
                style={{
                  backgroundColor: copied ? 'var(--player-1-light)' : 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-full)',
                  color: copied ? 'var(--player-1-dark)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-small)',
                  fontWeight: 500,
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar codigo'}
              </button>

              {/* Waiting indicator */}
              {waitingForPartner && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Loader2
                      size={16}
                      className="animate-spin"
                      style={{ color: 'var(--accent-info)' }}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}>
                      Esperando a tu pareja...
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-tiny)' }}>
                    El codigo expira en 48 horas
                  </span>

                  {/* Manual check button */}
                  <button
                    onClick={async () => {
                      const { data } = await supabase
                        .from('households')
                        .select('user2_id')
                        .eq('id', householdId)
                        .single()
                      if (data?.user2_id) {
                        setWaitingForPartner(false)
                        goTo('setup')
                      }
                    }}
                    className="mt-2 flex items-center gap-2 px-5 py-3 font-semibold"
                    style={{
                      backgroundColor: 'var(--player-1)',
                      color: 'var(--text-on-color)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-body)',
                    }}
                  >
                    Mi pareja ya se ha unido <ArrowRight size={18} />
                  </button>

                  {/* Skip option for creator (can configure while waiting) */}
                  <button
                    onClick={() => goTo('setup')}
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: 'var(--text-small)',
                      textDecoration: 'underline',
                    }}
                  >
                    Continuar a configuracion
                  </button>
                </motion.div>
              )}

              {!waitingForPartner && (
                <button
                  onClick={() => goTo('setup')}
                  className="mt-4 flex items-center gap-2 px-6 py-3 font-semibold"
                  style={{
                    backgroundColor: 'var(--player-1)',
                    color: 'var(--text-on-color)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-body)',
                  }}
                >
                  Continuar <ArrowRight size={18} />
                </button>
              )}
            </motion.div>
          )}

          {/* STEP 2B: Join - Enter code */}
          {step === 'join' && (
            <motion.div
              key="join"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springs.snappy}
              className="flex flex-col items-center"
            >
              <button
                onClick={() => goTo('choice', -1)}
                className="mb-6 flex items-center gap-1 self-start"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}
              >
                <ChevronLeft size={16} /> Volver
              </button>

              <div className="mb-2 text-4xl">🤝</div>
              <h1
                className="mb-2 font-bold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
              >
                Unirse a un hogar
              </h1>
              <p
                className="mb-6 text-center"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}
              >
                Introduce el codigo de 6 caracteres que te dio tu pareja
              </p>

              <div className="mb-4 w-full">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    setJoinError('')
                  }}
                  placeholder="XXXXXX"
                  className="w-full px-4 py-4 text-center font-bold tracking-[0.3em] uppercase"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    border: `2px solid ${joinError ? 'var(--error)' : 'var(--border-card)'}`,
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    if (!joinError) e.currentTarget.style.borderColor = 'var(--border-active)'
                  }}
                  onBlur={(e) => {
                    if (!joinError) e.currentTarget.style.borderColor = 'var(--border-card)'
                  }}
                />
                {joinError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-1"
                    style={{ color: 'var(--error)', fontSize: 'var(--text-small)' }}
                  >
                    <AlertCircle size={14} /> {joinError}
                  </motion.p>
                )}
              </div>

              <button
                onClick={handleJoinHousehold}
                disabled={loading || joinCode.length !== 6}
                className="flex w-full items-center justify-center gap-2 px-6 py-3 font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--player-2)',
                  color: 'var(--text-on-color)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-body)',
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Unirme <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* STEP 3: Setup */}
          {step === 'setup' && (
            <motion.div
              key="setup"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springs.snappy}
              className="flex flex-col"
            >
              <div className="mb-1 text-center text-4xl">⚙️</div>
              <h1
                className="mb-1 text-center font-bold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
              >
                Configurar hogar
              </h1>
              <p
                className="mb-6 text-center"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}
              >
                Establece las reglas del juego
              </p>

              <div className="flex flex-col gap-5">
                {/* Household name */}
                <div>
                  <label
                    className="mb-1.5 block font-medium"
                    style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                  >
                    Nombre del hogar
                  </label>
                  <input
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="Casa de Fran y Clara"
                    className="w-full px-4 py-3"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '2px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-body)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-card)')}
                  />
                </div>

                {/* Close day */}
                <div>
                  <label
                    className="mb-1.5 block font-medium"
                    style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                  >
                    Dia de cierre semanal
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => setCloseDay(day.value)}
                        className="px-3 py-2 font-medium"
                        style={{
                          backgroundColor:
                            closeDay === day.value ? 'var(--player-1)' : 'var(--bg-card)',
                          color:
                            closeDay === day.value ? 'var(--text-on-color)' : 'var(--text-primary)',
                          border: `2px solid ${closeDay === day.value ? 'var(--player-1)' : 'var(--border-card)'}`,
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--text-small)',
                        }}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Close time */}
                <div>
                  <label
                    className="mb-1.5 block font-medium"
                    style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                  >
                    Hora de cierre
                  </label>
                  <select
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full appearance-none px-4 py-3"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '2px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-body)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Competitive mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      Modo competitivo
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>
                      {competitiveMode ? 'Hay ganador y perdedor' : 'Solo seguimiento, sin apuesta'}
                    </div>
                  </div>
                  <button
                    onClick={() => setCompetitiveMode(!competitiveMode)}
                    className="relative h-7 w-12 rounded-full transition-colors"
                    style={{
                      backgroundColor: competitiveMode ? 'var(--player-1)' : 'var(--border-subtle)',
                    }}
                  >
                    <motion.div
                      layout
                      transition={springs.snappy}
                      className="absolute top-0.5 h-6 w-6 rounded-full bg-white"
                      style={{
                        left: competitiveMode ? 'calc(100% - 26px)' : '2px',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    />
                  </button>
                </div>

                {/* Reward text */}
                {competitiveMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label
                      className="mb-1.5 block font-medium"
                      style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                    >
                      El perdedor...
                    </label>
                    <input
                      type="text"
                      value={rewardText}
                      onChange={(e) => setRewardText(e.target.value)}
                      placeholder="paga la cena"
                      className="w-full px-4 py-3"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '2px solid var(--border-card)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-body)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-card)')}
                    />
                  </motion.div>
                )}

                {/* Tie threshold */}
                {competitiveMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label
                      className="mb-1.5 block font-medium"
                      style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                    >
                      Umbral de empate: {tieThreshold}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={tieThreshold}
                      onChange={(e) => setTieThreshold(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: 'var(--player-1)' }}
                    />
                    <div
                      className="mt-1 flex justify-between"
                      style={{ color: 'var(--text-muted)', fontSize: 'var(--text-tiny)' }}
                    >
                      <span>Sin empates</span>
                      <span>Empate facil</span>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Continue button */}
              <button
                onClick={handleSaveSetup}
                disabled={loading}
                className="mt-8 flex w-full items-center justify-center gap-2 py-3 font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--player-1)',
                  color: 'var(--text-on-color)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-body)',
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Elegir color <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* STEP 4: Avatar Color Selection */}
          {step === 'avatar' && (
            <motion.div
              key="avatar"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springs.snappy}
              className="flex flex-col items-center"
            >
              <button
                onClick={() => goTo('setup', -1)}
                className="mb-6 flex items-center gap-1 self-start"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}
              >
                <ChevronLeft size={16} /> Volver
              </button>

              <div className="mb-2 text-4xl">🎨</div>
              <h1
                className="mb-2 font-bold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
              >
                Elige tu color
              </h1>
              <p
                className="mb-8 text-center"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}
              >
                Este color te representara en el marcador y en la app
              </p>

              <div className="mb-8 flex flex-wrap justify-center gap-4">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setAvatarColor(color.hex)}
                    className="relative flex flex-col items-center gap-2"
                  >
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 56,
                        height: 56,
                        backgroundColor: color.hex,
                        border:
                          avatarColor === color.hex
                            ? '3px solid var(--accent-points)'
                            : '3px solid transparent',
                        boxShadow:
                          avatarColor === color.hex
                            ? '0 4px 16px ' + color.hex + '66'
                            : 'var(--shadow-sm)',
                      }}
                    >
                      {avatarColor === color.hex && (
                        <Check size={24} style={{ color: 'white' }} />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--text-tiny)',
                        color:
                          avatarColor === color.hex
                            ? 'var(--text-primary)'
                            : 'var(--text-muted)',
                        fontWeight: avatarColor === color.hex ? 600 : 400,
                      }}
                    >
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div
                className="mb-8 flex items-center gap-3 px-5 py-3"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-card)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full font-bold"
                  style={{
                    backgroundColor: avatarColor,
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-body)',
                  }}
                >
                  Tu
                </div>
                <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                  Asi te veran en el marcador
                </span>
              </div>

              <button
                onClick={handleSaveAvatar}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 py-3 font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--player-1)',
                  color: 'var(--text-on-color)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-body)',
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Revisar tareas <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* STEP 5: Tasks review */}
          {step === 'tasks' && (
            <motion.div
              key="tasks"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springs.snappy}
              className="flex flex-col"
            >
              <button
                onClick={() => goTo('avatar', -1)}
                className="mb-4 flex items-center gap-1 self-start"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}
              >
                <ChevronLeft size={16} /> Volver
              </button>

              <div className="mb-1 text-center text-4xl">📋</div>
              <h1
                className="mb-1 text-center font-bold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
              >
                Tareas del hogar
              </h1>
              <p
                className="mb-5 text-center"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}
              >
                Revisa y ajusta los puntos. Desactiva las que no apliquen
              </p>

              <div className="flex flex-col gap-2">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      backgroundColor: task.is_active ? 'var(--bg-card)' : 'var(--bg-secondary)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      opacity: task.is_active ? 1 : 0.5,
                    }}
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => toggleTask(index)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: task.is_active ? 'var(--player-1)' : 'var(--border-subtle)',
                        border: 'none',
                      }}
                    >
                      {task.is_active && <Check size={14} style={{ color: 'white' }} />}
                    </button>

                    {/* Emoji + Name */}
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <span className="text-lg">{task.emoji}</span>
                      <span
                        className="truncate font-medium"
                        style={{ fontSize: 'var(--text-small)' }}
                      >
                        {task.name}
                      </span>
                    </div>

                    {/* Points adjuster */}
                    {task.is_active && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => updateTaskPoints(index, -10)}
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <Minus size={12} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <span
                          className="w-10 text-center font-bold"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'var(--text-small)',
                            color: 'var(--accent-points-dark)',
                          }}
                        >
                          {task.points}
                        </span>
                        <button
                          onClick={() => updateTaskPoints(index, 10)}
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <Plus size={12} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Active count */}
              <p
                className="mt-3 text-center"
                style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}
              >
                {tasks.filter((t) => t.is_active).length} tareas activas de {tasks.length}
              </p>

              {/* Finish button */}
              <button
                onClick={handleFinish}
                disabled={loading || tasks.filter((t) => t.is_active).length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 py-3 font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--player-1)',
                  color: 'var(--text-on-color)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-body)',
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Empezar a jugar <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
