import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): string | null {
    if (username.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
    if (username.trim().length > 20) return 'El nombre no puede tener mas de 20 caracteres'
    if (password.length < 6) return 'La contrasena debe tener al menos 6 caracteres'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim() },
        },
      })
      if (authError) throw authError

      // Profile is created automatically by DB trigger
      navigate('/onboarding', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta'
      if (message.includes('already registered')) {
        setError('Este email ya esta registrado')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
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
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--text-small)',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-1)',
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Title */}
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
            Crear cuenta
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
            Empieza a competir en casa
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
            {/* Username */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="username" style={labelStyle}>
                Tu nombre
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="name"
                placeholder="Como te llamas?"
                maxLength={20}
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--border-active)')
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--border-subtle)')
                }
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="email" style={labelStyle}>
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
                style={inputStyle}
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
              <label htmlFor="password" style={labelStyle}>
                Contrasena
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Minimo 6 caracteres"
                  style={{
                    ...inputStyle,
                    paddingRight: '48px',
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
              <p
                style={{
                  fontSize: 'var(--text-tiny)',
                  color: 'var(--text-muted)',
                  marginTop: 'var(--space-1)',
                }}
              >
                Minimo 6 caracteres
              </p>
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
                background: 'var(--player-2)',
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p
          className="mt-6 text-center"
          style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }}
        >
          Ya tienes cuenta?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--player-2-dark)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  )
}
