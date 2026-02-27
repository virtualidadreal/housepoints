import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) throw authError

      // Check if user has a household
      const { data: household } = await supabase
        .from('households')
        .select('id')
        .or(`user1_id.eq.${data.user.id},user2_id.eq.${data.user.id}`)
        .single()

      if (household) {
        navigate('/home', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesion'
      if (message.includes('Invalid login credentials')) {
        setError('Email o contrasena incorrectos')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="mb-10 text-center">
          <h1
            className="mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            HousePoints
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
            Quien hace mas en casa?
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-small)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 'var(--text-body)',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--border-active)')
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--border-subtle)')
                }
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-small)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Contrasena
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Tu contrasena"
                  style={{
                    width: '100%',
                    padding: '12px 48px 12px 16px',
                    fontSize: 'var(--text-body)',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--border-active)')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--border-subtle)')
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                  }}
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  fontSize: 'var(--text-small)',
                  color: 'var(--error)',
                  marginBottom: 'var(--space-4)',
                  textAlign: 'center',
                }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 'var(--text-body)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--text-on-color)',
                background: 'var(--player-1)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s, transform 0.1s',
              }}
              onMouseDown={(e) => {
                if (!loading) e.currentTarget.style.transform = 'scale(0.97)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p
          className="mt-6 text-center"
          style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }}
        >
          No tienes cuenta?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--player-1-dark)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}
