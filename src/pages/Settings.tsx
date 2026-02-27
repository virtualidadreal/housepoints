import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Check,
  Copy,
  Loader2,
  LogOut,
  Flag,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/household'
import { useAuth } from '../hooks/useAuth'
import { generateInviteCode } from '../utils/invite'
import { getCurrentWeekId } from '../utils/week'
import { springs } from '../lib/animations'
import type { Household } from '../lib/types'

const AVATAR_COLORS = [
  { name: 'Verde menta', hex: '#6BCB77' },
  { name: 'Rosa coral', hex: '#FF6B8A' },
  { name: 'Azul cielo', hex: '#7EB6FF' },
  { name: 'Amarillo sol', hex: '#FFD93D' },
  { name: 'Lavanda', hex: '#B197FC' },
  { name: 'Naranja', hex: '#FFB347' },
]

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mie' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

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

const TIMEZONES = [
  { value: 'Europe/Madrid', label: 'Espana (Madrid)' },
  { value: 'Europe/London', label: 'Reino Unido (Londres)' },
  { value: 'Europe/Paris', label: 'Francia (Paris)' },
  { value: 'Europe/Berlin', label: 'Alemania (Berlin)' },
  { value: 'Europe/Rome', label: 'Italia (Roma)' },
  { value: 'Europe/Lisbon', label: 'Portugal (Lisboa)' },
  { value: 'Atlantic/Canary', label: 'Canarias' },
  { value: 'America/Mexico_City', label: 'Mexico (Ciudad de Mexico)' },
  { value: 'America/Bogota', label: 'Colombia (Bogota)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Lima', label: 'Peru (Lima)' },
  { value: 'America/New_York', label: 'EEUU (Nueva York)' },
  { value: 'America/Los_Angeles', label: 'EEUU (Los Angeles)' },
]

export default function Settings() {
  const navigate = useNavigate()
  const household = useHouseholdStore((s) => s.household)
  const profile = useHouseholdStore((s) => s.profile)
  const setHousehold = useHouseholdStore((s) => s.setHousehold)
  const setProfile = useHouseholdStore((s) => s.setProfile)
  const { signOut } = useAuth()

  // Form state
  const [name, setName] = useState('')
  const [closeDay, setCloseDay] = useState(0)
  const [closeTime, setCloseTime] = useState('23:59')
  const [competitiveMode, setCompetitiveMode] = useState(true)
  const [rewardText, setRewardText] = useState('paga la cena')
  const [tieThreshold, setTieThreshold] = useState(5)
  const [avatarColor, setAvatarColor] = useState('#6BCB77')
  const [timezone, setTimezone] = useState('Europe/Madrid')

  // UI state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [noBetLoading, setNoBetLoading] = useState(false)
  const [isNoBetWeek, setIsNoBetWeek] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // Initialize form from store
  useEffect(() => {
    if (household) {
      setName(household.name ?? '')
      setCloseDay(household.week_close_day)
      setCloseTime(
        `${String(household.week_close_hour).padStart(2, '0')}:${String(household.week_close_minute).padStart(2, '0')}`
      )
      setCompetitiveMode(household.competitive_mode)
      setRewardText(household.reward_text)
      setTieThreshold(household.tie_threshold)
      setTimezone(household.timezone)
    }
    if (profile) {
      setAvatarColor(profile.avatar_color ?? '#6BCB77')
    }
  }, [household, profile])

  // Check no-bet status
  useEffect(() => {
    if (!household) return
    checkNoBet()
  }, [household?.id])

  async function checkNoBet() {
    if (!household) return
    const weekId = getCurrentWeekId(household)
    const { data } = await supabase
      .from('no_bet_weeks')
      .select('id')
      .eq('household_id', household.id)
      .eq('week_id', weekId)
      .maybeSingle()

    setIsNoBetWeek(!!data)
  }

  // Save household settings
  async function handleSave() {
    if (!household) return
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const [hourStr, minuteStr] = closeTime.split(':')

      const { data, error: updateError } = await supabase
        .from('households')
        .update({
          name: name || null,
          week_close_day: closeDay,
          week_close_hour: parseInt(hourStr, 10),
          week_close_minute: parseInt(minuteStr, 10),
          competitive_mode: competitiveMode,
          reward_text: rewardText || 'paga la cena',
          tie_threshold: tieThreshold,
          timezone,
        })
        .eq('id', household.id)
        .select()
        .single()

      if (updateError) throw updateError
      if (data) setHousehold(data as Household)

      // Save avatar color
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ avatar_color: avatarColor })
          .eq('id', user.id)

        if (profile) {
          setProfile({ ...profile, avatar_color: avatarColor })
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Declare no-bet week
  async function handleNoBet() {
    if (!household) return
    setNoBetLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const weekId = getCurrentWeekId(household)

      const { error } = await supabase.from('no_bet_weeks').insert({
        household_id: household.id,
        requested_by: user.id,
        week_id: weekId,
      })

      if (error) throw error
      setIsNoBetWeek(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setNoBetLoading(false)
    }
  }

  // Regenerate invite code
  async function handleRegenerateCode() {
    if (!household) return
    setRegenerating(true)

    try {
      const code = generateInviteCode()
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

      const { error } = await supabase
        .from('households')
        .update({
          invite_code: code,
          invite_expires_at: expiresAt,
        })
        .eq('id', household.id)

      if (error) throw error
      setInviteCode(code)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setRegenerating(false)
    }
  }

  async function handleCopyCode() {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
    } catch {
      const el = document.createElement('textarea')
      el.value = inviteCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!household) return null

  const isSolo = !household.user2_id

  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: 'var(--bg-primary)',
        paddingBottom: 'var(--space-12)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: 'var(--space-4) var(--space-5)',
          paddingTop: 'max(var(--space-4), env(safe-area-inset-top))',
        }}
      >
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-1"
          style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}
        >
          <ChevronLeft size={18} /> Inicio
        </button>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h2)',
            fontWeight: 700,
          }}
        >
          Ajustes
        </h1>
        <div style={{ width: 50 }} />
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mb-4 flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ backgroundColor: '#FFF0F0', color: 'var(--error)' }}
        >
          <AlertCircle size={18} />
          <span style={{ fontSize: 'var(--text-small)' }}>{error}</span>
        </motion.div>
      )}

      <div style={{ padding: '0 var(--space-5)' }} className="flex flex-col gap-5">
        {/* Household name */}
        <Section title="Nombre del hogar">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Casa de..."
            className="w-full px-4 py-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '2px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-body)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </Section>

        {/* Close day + time */}
        <Section title="Cierre semanal">
          <div className="mb-3 flex flex-wrap gap-2">
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
          <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-tiny)' }}>
            Los cambios de dia/hora aplican desde la siguiente semana
          </p>
        </Section>

        {/* Timezone */}
        <Section title="Zona horaria">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
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
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </Section>

        {/* Competitive mode */}
        <Section title="Modo de juego">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium" style={{ fontSize: 'var(--text-body)' }}>
                Modo competitivo
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>
                {competitiveMode ? 'Hay ganador y perdedor' : 'Solo seguimiento'}
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

          {competitiveMode && (
            <>
              <div className="mt-4">
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
                />
              </div>

              <div className="mt-4">
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
              </div>
            </>
          )}
        </Section>

        {/* No-bet week */}
        {competitiveMode && (
          <Section title="Semana sin apuesta">
            {isNoBetWeek ? (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{
                  backgroundColor: 'var(--accent-points-light)',
                  fontSize: 'var(--text-body)',
                }}
              >
                <Flag size={18} style={{ color: 'var(--accent-points-dark)' }} />
                <span style={{ color: 'var(--accent-points-dark)' }}>
                  Esta semana sin apuesta activa
                </span>
              </div>
            ) : (
              <button
                onClick={handleNoBet}
                disabled={noBetLoading}
                className="flex w-full items-center justify-center gap-2 px-4 py-3 font-medium disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '2px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-body)',
                  color: 'var(--text-primary)',
                }}
              >
                {noBetLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Flag size={16} style={{ color: 'var(--accent-warning)' }} />
                )}
                Esta semana sin apuesta
              </button>
            )}
            <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-tiny)' }}>
              Los puntos se cuentan para el historial, pero no hay ganador ni perdedor
            </p>
          </Section>
        )}

        {/* Avatar color */}
        <Section title="Tu color">
          <div className="flex flex-wrap gap-3">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => setAvatarColor(color.hex)}
                className="relative flex flex-col items-center gap-1"
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: color.hex,
                    border:
                      avatarColor === color.hex
                        ? '3px solid var(--accent-points)'
                        : '3px solid transparent',
                    boxShadow:
                      avatarColor === color.hex
                        ? '0 4px 16px ' + color.hex + '66'
                        : 'none',
                  }}
                >
                  {avatarColor === color.hex && (
                    <Check size={20} style={{ color: 'white' }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Invite code (only if solo) */}
        {isSolo && (
          <Section title="Codigo de invitacion">
            {inviteCode ? (
              <div className="flex items-center gap-3">
                <span
                  className="font-bold tracking-[0.2em]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-h2)',
                  }}
                >
                  {inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: copied ? 'var(--player-1-light)' : 'var(--bg-elevated)',
                    color: copied ? 'var(--player-1-dark)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-small)',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleRegenerateCode}
                disabled={regenerating}
                className="flex items-center gap-2 px-4 py-3 font-medium disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '2px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-body)',
                  color: 'var(--text-primary)',
                }}
              >
                {regenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} style={{ color: 'var(--accent-info)' }} />
                )}
                Generar nuevo codigo
              </button>
            )}
            <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-tiny)' }}>
              Tu hogar solo tiene 1 persona. Genera un codigo para invitar a tu pareja.
            </p>
          </Section>
        )}

        {/* Manage tasks link */}
        <Section title="Tareas">
          <button
            onClick={() => navigate('/tasks')}
            className="flex w-full items-center justify-between px-4 py-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '2px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-body)',
              color: 'var(--text-primary)',
            }}
          >
            <span>Gestionar catalogo de tareas</span>
            <ChevronLeft
              size={16}
              style={{ color: 'var(--text-muted)', transform: 'rotate(180deg)' }}
            />
          </button>
        </Section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 py-3 font-semibold disabled:opacity-50"
          style={{
            backgroundColor: saved ? 'var(--success)' : 'var(--player-1)',
            color: 'var(--text-on-color)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-body)',
          }}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : saved ? (
            <>
              <Check size={18} /> Guardado
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 py-3 font-medium"
          style={{
            color: 'var(--error)',
            fontSize: 'var(--text-body)',
          }}
        >
          <LogOut size={18} /> Cerrar sesion
        </button>
      </div>
    </div>
  )
}

// Section component for consistent styling
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="mb-2"
        style={{
          fontSize: 'var(--text-small)',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}
